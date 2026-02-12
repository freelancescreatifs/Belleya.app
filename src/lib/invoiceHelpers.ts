import { supabase } from './supabase';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  service_id?: string | null;
  label: string;
  price: number;
  quantity: number;
  duration_minutes?: number | null;
  discount: number;
  line_total: number;
}

export interface Invoice {
  id?: string;
  provider_id: string;
  client_id: string;
  appointment_id?: string | null;
  title: string;
  notes?: string | null;
  subtotal: number;
  discount_total: number;
  total: number;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceWithDetails extends Invoice {
  items: InvoiceItem[];
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  appointment?: {
    id: string;
    start_time: string;
    end_time: string;
  };
}

/**
 * Create a new invoice with items
 */
export async function createInvoice(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
) {
  try {
    // Create invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        provider_id: invoice.provider_id,
        client_id: invoice.client_id,
        appointment_id: invoice.appointment_id,
        title: invoice.title,
        notes: invoice.notes,
        subtotal: invoice.subtotal,
        discount_total: invoice.discount_total,
        total: invoice.total,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoiceData.id,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId);

    if (itemsError) throw itemsError;

    return { data: invoiceData, error: null };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { data: null, error };
  }
}

/**
 * Get invoice by ID with items and related data
 */
export async function getInvoiceById(invoiceId: string): Promise<InvoiceWithDetails | null> {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, first_name, last_name, email, phone),
        appointment:events(id, start_time, end_time)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      ...invoice,
      items: items || [],
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

/**
 * Get invoices for a provider
 */
export async function getProviderInvoices(providerId: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, first_name, last_name, email, phone),
        appointment:events(id, start_time, end_time)
      `)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching provider invoices:', error);
    return { data: null, error };
  }
}

/**
 * Get invoices for a client
 */
export async function getClientInvoices(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        appointment:events(id, start_time, end_time)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    return { data: null, error };
  }
}

/**
 * Get invoice for a specific appointment
 */
export async function getInvoiceByAppointment(appointmentId: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, first_name, last_name, email, phone)
      `)
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return { data: null, error: null };

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', data.id)
      .order('created_at', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      data: {
        ...data,
        items: items || [],
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching invoice by appointment:', error);
    return { data: null, error };
  }
}

/**
 * Update an invoice
 */
export async function updateInvoice(
  invoiceId: string,
  updates: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'provider_id'>>
) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating invoice:', error);
    return { data: null, error };
  }
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(invoiceId: string) {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { error };
  }
}

/**
 * Send invoice via email
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice || !invoice.client) {
      return { success: false, error: 'Invoice or client not found' };
    }

    if (!invoice.client.email) {
      return { success: false, error: 'Client email not available' };
    }

    const { data: profile } = await supabase
      .from('company_profiles')
      .select('company_name')
      .eq('user_id', invoice.provider_id)
      .single();

    const providerName = profile?.company_name || 'Votre prestataire';
    const appointmentDate = invoice.appointment
      ? new Date(invoice.appointment.start_time).toLocaleDateString('fr-FR')
      : undefined;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-email`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId: invoice.id,
        clientEmail: invoice.client.email,
        clientName: invoice.client.first_name,
        providerName,
        appointmentDate,
        items: invoice.items.map(item => ({
          label: item.label,
          quantity: item.quantity,
          price: item.price,
          lineTotal: item.line_total,
        })),
        total: invoice.total,
        notes: invoice.notes,
        customMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    // Log the send
    await supabase.from('invoice_sends').insert({
      invoice_id: invoiceId,
      provider_id: invoice.provider_id,
      client_id: invoice.client_id,
      channel: 'email',
      payload: { customMessage },
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending invoice email:', error);

    // Log failed send
    try {
      const invoice = await getInvoiceById(invoiceId);
      if (invoice) {
        await supabase.from('invoice_sends').insert({
          invoice_id: invoiceId,
          provider_id: invoice.provider_id,
          client_id: invoice.client_id,
          channel: 'email',
          payload: { customMessage },
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } catch (logError) {
      console.error('Error logging failed send:', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send invoice via SMS
 */
export async function sendInvoiceSMS(
  invoiceId: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice || !invoice.client) {
      return { success: false, error: 'Invoice or client not found' };
    }

    if (!invoice.client.phone) {
      return { success: false, error: 'Client phone not available' };
    }

    const { data: profile } = await supabase
      .from('company_profiles')
      .select('company_name')
      .eq('user_id', invoice.provider_id)
      .single();

    const providerName = profile?.company_name || 'Votre prestataire';
    const appointmentDate = invoice.appointment
      ? new Date(invoice.appointment.start_time).toLocaleDateString('fr-FR')
      : undefined;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-sms`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId: invoice.id,
        clientPhone: invoice.client.phone,
        clientName: invoice.client.first_name,
        providerName,
        appointmentDate,
        total: invoice.total,
        customMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send SMS');
    }

    // Log the send
    await supabase.from('invoice_sends').insert({
      invoice_id: invoiceId,
      provider_id: invoice.provider_id,
      client_id: invoice.client_id,
      channel: 'sms',
      payload: { customMessage },
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending invoice SMS:', error);

    // Log failed send
    try {
      const invoice = await getInvoiceById(invoiceId);
      if (invoice) {
        await supabase.from('invoice_sends').insert({
          invoice_id: invoiceId,
          provider_id: invoice.provider_id,
          client_id: invoice.client_id,
          channel: 'sms',
          payload: { customMessage },
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } catch (logError) {
      console.error('Error logging failed send:', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate invoice totals from items
 */
export function calculateInvoiceTotals(items: InvoiceItem[], discountTotal: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const total = subtotal - discountTotal;

  return {
    subtotal: Math.max(0, subtotal),
    total: Math.max(0, total),
  };
}

/**
 * Calculate line total for an item
 */
export function calculateLineTotal(price: number, quantity: number, discount: number = 0) {
  return Math.max(0, (price * quantity) - discount);
}
