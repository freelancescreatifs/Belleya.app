export interface ClientReminder {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  last_appointment_date: string | null;
  recommended_frequency_days: number | null;
  days_since_last_visit: number;
  days_late: number;
  reminder_type: 'gentle' | 'standard' | 'strong' | 'birthday' | 'inactive';
  average_basket: number;
  total_visits: number;
  birth_date: string | null;
  days_until_birthday: number | null;
  expected_return_date: string | null;
  service_name: string | null;
}

export interface MarketingStats {
  clients_to_remind_this_week: number;
  clients_late: number;
  upcoming_birthdays: number;
  return_rate: number;
  potential_revenue: number;
}

export function calculateDaysSince(date: string | null): number {
  if (!date) return 999;

  try {
    const lastDate = new Date(date);
    if (isNaN(lastDate.getTime())) return 999;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(lastDate);
    checkDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - checkDate.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, days);
  } catch (error) {
    console.error('Error calculating days since:', error, date);
    return 999;
  }
}

export function calculateDaysUntil(date: string | null): number | null {
  if (!date) return null;

  try {
    const birthDate = new Date(date);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();

    let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
    nextBirthday.setHours(0, 0, 0, 0);

    if (nextBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
      nextBirthday.setHours(0, 0, 0, 0);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    console.log('[Birthday Calc]', {
      input_date: date,
      birth_month: birthMonth + 1,
      birth_day: birthDay,
      today: today.toISOString().split('T')[0],
      next_birthday: nextBirthday.toISOString().split('T')[0],
      days_until: days
    });

    return days >= 0 ? days : null;
  } catch (error) {
    console.error('Error calculating days until birthday:', error, date);
    return null;
  }
}

export function getReminderType(
  daysSinceLastVisit: number,
  recommendedFrequencyDays: number | null,
  daysUntilBirthday: number | null
): 'gentle' | 'standard' | 'strong' | 'birthday' | 'inactive' {
  if (daysUntilBirthday !== null && daysUntilBirthday <= 7) {
    return 'birthday';
  }

  if (daysSinceLastVisit > 90) {
    return 'inactive';
  }

  if (!recommendedFrequencyDays) {
    return 'gentle';
  }

  const daysLate = daysSinceLastVisit - recommendedFrequencyDays;

  if (daysLate < 0) return 'gentle';
  if (daysLate <= 7) return 'gentle';
  if (daysLate <= 21) return 'standard';
  return 'strong';
}

export function getReminderLabel(type: 'gentle' | 'standard' | 'strong' | 'birthday' | 'inactive'): string {
  const labels = {
    gentle: '🔔 Relance douce',
    standard: '⚠️ Relance standard',
    strong: '🔥 Relance forte',
    birthday: '🎂 Anniversaire',
    inactive: '💤 Inactive'
  };
  return labels[type];
}

export function getReminderColor(type: 'gentle' | 'standard' | 'strong' | 'birthday' | 'inactive'): string {
  const colors = {
    gentle: 'bg-blue-100 text-blue-800',
    standard: 'bg-yellow-100 text-yellow-800',
    strong: 'bg-red-100 text-red-800',
    birthday: 'bg-pink-100 text-pink-800',
    inactive: 'bg-gray-100 text-gray-800'
  };
  return colors[type];
}

export function getDefaultDiscount(type: 'gentle' | 'standard' | 'strong' | 'birthday' | 'inactive'): number {
  const discounts = {
    gentle: 0,
    standard: 10,
    strong: 15,
    birthday: 20,
    inactive: 15
  };
  return discounts[type];
}

export function calculatePotentialRevenue(clients: ClientReminder[]): number {
  return clients.reduce((sum, client) => sum + (client.average_basket || 0), 0);
}

export interface ClientWithLastEvent {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  last_event?: {
    start_at: string;
    status: string;
    service?: {
      name: string;
      price: number;
      recommended_frequency: number | null;
    } | null;
  } | null;
  total_events?: number;
  total_spent?: number;
}

export function processClientForReminders(
  client: ClientWithLastEvent
): ClientReminder | null {
  const daysUntilBirthday = calculateDaysUntil(client.birth_date);

  if (!client.last_event || !client.last_event.start_at) {
    if (daysUntilBirthday !== null && daysUntilBirthday <= 30) {
      return {
        id: `${client.id}-${Date.now()}`,
        client_id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        phone: client.phone,
        last_appointment_date: null,
        recommended_frequency_days: null,
        days_since_last_visit: 999,
        days_late: 0,
        reminder_type: 'birthday',
        average_basket: 0,
        total_visits: client.total_events || 0,
        birth_date: client.birth_date,
        days_until_birthday: daysUntilBirthday,
        expected_return_date: null,
        service_name: null
      };
    }
    return null;
  }

  const lastAppointmentDate = client.last_event.start_at;
  const daysSinceLastVisit = calculateDaysSince(lastAppointmentDate);
  const recommendedFrequencyDays = client.last_event.service?.recommended_frequency || null;
  const serviceName = client.last_event.service?.name || null;

  let expectedReturnDate: string | null = null;
  let daysLate = 0;

  if (recommendedFrequencyDays) {
    const lastDate = new Date(lastAppointmentDate);
    const expectedDate = new Date(lastDate);
    expectedDate.setDate(expectedDate.getDate() + recommendedFrequencyDays);
    expectedReturnDate = expectedDate.toISOString();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expectedDateNormalized = new Date(expectedDate);
    expectedDateNormalized.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - expectedDateNormalized.getTime();
    daysLate = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  const reminderType = getReminderType(
    daysSinceLastVisit,
    recommendedFrequencyDays,
    daysUntilBirthday
  );

  const shouldRemind =
    (daysUntilBirthday !== null && daysUntilBirthday <= 30) ||
    (recommendedFrequencyDays && daysLate >= 0) ||
    daysSinceLastVisit > 60;

  if (!shouldRemind) {
    return null;
  }

  const averageBasket = (client.total_events && client.total_events > 0)
    ? (client.total_spent || 0) / client.total_events
    : 0;

  return {
    id: `${client.id}-${Date.now()}`,
    client_id: client.id,
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
    phone: client.phone,
    last_appointment_date: lastAppointmentDate,
    recommended_frequency_days: recommendedFrequencyDays,
    days_since_last_visit: daysSinceLastVisit,
    days_late: daysLate,
    reminder_type: reminderType,
    average_basket: averageBasket,
    total_visits: client.total_events || 0,
    birth_date: client.birth_date,
    days_until_birthday: daysUntilBirthday,
    expected_return_date: expectedReturnDate,
    service_name: serviceName
  };
}

export function replaceTemplateVariables(
  template: string,
  client: ClientReminder,
  discount?: number,
  validUntil?: string
): string {
  let result = template;

  result = result.replace(/{{prenom}}/g, client.first_name);
  result = result.replace(/{{nom}}/g, client.last_name);

  if (discount !== undefined) {
    const offerText = discount > 0 ? `-${discount}%` : 'un petit bonus';
    result = result.replace(/{{offre}}/g, offerText);
  }

  if (validUntil) {
    const date = new Date(validUntil);
    const dateStr = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    });
    result = result.replace(/{{date}}/g, dateStr);
  }

  return result;
}

export interface MarketingDebugInfo {
  total_clients: number;
  clients_with_last_appointment: number;
  clients_with_frequency: number;
  clients_with_birth_date: number;
  clients_remindable: number;
  clients_late: number;
  clients_birthday_30d: number;
  missing_data: {
    no_last_appointment: string[];
    no_frequency: string[];
    no_birth_date: string[];
  };
}

export function generateDebugInfo(
  allClientsWithEvents: ClientWithLastEvent[],
  reminders: ClientReminder[]
): MarketingDebugInfo {
  const clientsWithLastAppointment = allClientsWithEvents.filter(
    c => c.last_event && c.last_event.start_at
  );

  const clientsWithFrequency = allClientsWithEvents.filter(
    c => c.last_event?.service?.recommended_frequency
  );

  const clientsWithBirthDate = allClientsWithEvents.filter(c => c.birth_date);

  const clientsLate = reminders.filter(r => r.days_late > 0);
  const clientsBirthday30d = reminders.filter(
    r => r.days_until_birthday !== null && r.days_until_birthday <= 30
  );

  const noLastAppointment = allClientsWithEvents
    .filter(c => !c.last_event || !c.last_event.start_at)
    .map(c => `${c.first_name} ${c.last_name}`);

  const noFrequency = allClientsWithEvents
    .filter(c => c.last_event && c.last_event.start_at && !c.last_event.service?.recommended_frequency)
    .map(c => `${c.first_name} ${c.last_name}`);

  const noBirthDate = allClientsWithEvents
    .filter(c => !c.birth_date)
    .map(c => `${c.first_name} ${c.last_name}`);

  return {
    total_clients: allClientsWithEvents.length,
    clients_with_last_appointment: clientsWithLastAppointment.length,
    clients_with_frequency: clientsWithFrequency.length,
    clients_with_birth_date: clientsWithBirthDate.length,
    clients_remindable: reminders.length,
    clients_late: clientsLate.length,
    clients_birthday_30d: clientsBirthday30d.length,
    missing_data: {
      no_last_appointment: noLastAppointment,
      no_frequency: noFrequency,
      no_birth_date: noBirthDate
    }
  };
}
