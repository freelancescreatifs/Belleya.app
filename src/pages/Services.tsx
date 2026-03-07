import { useState, useEffect } from 'react';
import { Plus, Pencil, Copy, Power, TrendingUp, X, Upload, Trash2, CheckCircle, Archive, Eye, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import InfoTooltip from '../components/shared/InfoTooltip';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import { getServiceTypeTag, SERVICE_TYPES, type ServiceType } from '../lib/serviceTypeHelpers';
import SupplementsManager from '../components/services/SupplementsManager';
import SupplementsDisplay from '../components/shared/SupplementsDisplay';

interface Service {
  id: string;
  name: string;
  description: string | null;
  service_type: ServiceType;
  category: string;
  duration: number;
  price: number;
  status: string;
  recommended_frequency: number | null;
  has_vat: boolean;
  photo_url: string | null;
  special_offer: string | null;
  offer_type: 'percentage' | 'fixed' | null;
  created_at: string;
  supplements?: Array<{
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  }>;
}

export default function Services() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<'active' | 'hidden' | 'archived'>('active');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [serviceNameFilter, setServiceNameFilter] = useState<string>('');
  const [tempSupplements, setTempSupplements] = useState<Array<{
    name: string;
    duration_minutes: string;
    price: string;
  }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    service_type: 'prestation' as ServiceType,
    category: '',
    duration: '60',
    price: '',
    status: 'active',
    recommended_frequency: '',
    has_vat: false,
    photo_url: '',
    special_offer: '',
    offer_type: '' as '' | 'percentage' | 'fixed',
  });

  const prestationCategories = [
    'Ongles',
    'Cils',
    'Soins',
    'Manucure',
    'Pédicure',
    'Pose',
    'Remplissage',
    'Autre'
  ];

  const formationCategories = [
    'Ongles',
    'Cils',
    'Pédicure',
    'Manucure',
    'Business',
    'Marketing',
    'Technique',
    'Autre'
  ];

  const categories = formData.service_type === 'formation' ? formationCategories : prestationCategories;

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  useEffect(() => {
    if (!editingService && formData.service_type === 'formation' && tempSupplements.length > 0) {
      setTempSupplements(tempSupplements.map(supp => ({
        ...supp,
        duration_minutes: ''
      })));
    }
  }, [formData.service_type]);

  const fetchServices = async () => {
    if (!user) return;

    try {
      const [servicesRes, supplementsRes] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('service_supplements')
          .select('service_id, id, name, price, duration_minutes')
          .eq('user_id', user.id)
          .order('created_at')
      ]);

      if (servicesRes.error) throw servicesRes.error;

      const supplementsData = supplementsRes.data || [];
      const supplementsByService = supplementsData.reduce((acc, supp: any) => {
        if (!acc[supp.service_id]) {
          acc[supp.service_id] = [];
        }
        acc[supp.service_id].push({
          id: supp.id,
          name: supp.name,
          price: supp.price,
          duration_minutes: supp.duration_minutes || 0
        });
        return acc;
      }, {} as Record<string, any[]>);

      const servicesWithSupplements = (servicesRes.data || []).map(service => ({
        ...service,
        supplements: supplementsByService[service.id] || []
      }));

      setServices(servicesWithSupplements);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Maximum 5 Mo.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image.');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;

    try {
      setUploading(true);
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('service-photos')
        .upload(fileName, photoFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (service: Service) => {
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('service_id', service.id)
        .limit(1);

      if (bookingsError) {
        console.error('Error checking bookings:', bookingsError);
        alert('Erreur lors de la vérification des réservations.');
        return;
      }

      if (bookings && bookings.length > 0) {
        alert(
          `Impossible de supprimer ce service.\n\n` +
          `Des réservations sont associées à "${service.name}".\n\n` +
          `Vous pouvez plutôt désactiver ce service pour qu'il ne soit plus visible aux nouveaux clients.`
        );
        return;
      }

      if (!confirm(`Êtes-vous sûr de vouloir supprimer "${service.name}" ?\n\nCette action est irréversible.`)) {
        return;
      }

      if (service.photo_url) {
        const path = service.photo_url.split('/service-photos/')[1];
        if (path) {
          try {
            await supabase.storage.from('service-photos').remove([path]);
          } catch (storageError) {
            console.warn('Could not delete photo from storage:', storageError);
          }
        }
      }

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      await fetchServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      alert(`Erreur lors de la suppression du service: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let photoUrl = formData.photo_url;

      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;

          if (editingService?.photo_url) {
            const oldPath = editingService.photo_url.split('/service-photos/')[1];
            if (oldPath) {
              await supabase.storage.from('service-photos').remove([oldPath]);
            }
          }
        }
      }

      const durationValue = formData.duration ? parseInt(formData.duration) : 60;
      const priceValue = formData.price ? parseFloat(formData.price) : 0;
      const recommendedFrequencyValue = formData.recommended_frequency ? parseInt(formData.recommended_frequency) : null;

      const serviceData = {
        name: formData.name,
        description: formData.description,
        service_type: formData.service_type,
        category: formData.category,
        duration: durationValue,
        price: priceValue,
        status: formData.status,
        recommended_frequency: recommendedFrequencyValue,
        has_vat: formData.has_vat,
        photo_url: photoUrl,
        special_offer: formData.special_offer && formData.offer_type ? formData.special_offer : null,
        offer_type: formData.special_offer && formData.offer_type ? formData.offer_type : null,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            ...serviceData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        const { data: newService, error } = await supabase
          .from('services')
          .insert([{
            ...serviceData,
            user_id: user?.id,
          }])
          .select()
          .single();

        if (error) throw error;

        if (newService && tempSupplements.length > 0) {
          for (let i = 0; i < tempSupplements.length; i++) {
            const supp = tempSupplements[i];
            if (!supp.name || supp.name.trim() === '') {
              alert(`Le supplément #${i + 1} doit avoir un nom`);
              return;
            }
            if (!supp.price || supp.price.trim() === '' || isNaN(parseFloat(supp.price))) {
              alert(`Le supplément #${i + 1} doit avoir un prix valide`);
              return;
            }
            if (formData.service_type === 'prestation' && (!supp.duration_minutes || supp.duration_minutes.trim() === '')) {
              alert(`Le supplément #${i + 1} doit avoir une durée pour une prestation`);
              return;
            }
          }

          const supplementsData = tempSupplements.map(supp => {
            const durationValue = supp.duration_minutes ? parseInt(supp.duration_minutes) : 0;
            const priceValue = parseFloat(supp.price);
            return {
              service_id: newService.id,
              user_id: user?.id,
              name: supp.name,
              duration_minutes: durationValue > 0 ? durationValue : null,
              price: priceValue
            };
          });

          const { error: suppError } = await supabase
            .from('service_supplements')
            .insert(supplementsData);

          if (suppError) console.error('Error inserting supplements:', suppError);
        }
      }

      fetchServices();
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Erreur lors de l\'enregistrement du service.');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      service_type: service.service_type || 'prestation',
      category: service.category,
      duration: service.duration.toString(),
      price: service.price.toString(),
      status: service.status,
      recommended_frequency: service.recommended_frequency ? service.recommended_frequency.toString() : '',
      has_vat: service.has_vat,
      photo_url: service.photo_url || '',
      special_offer: service.special_offer || '',
      offer_type: service.offer_type || '',
    });
    setPhotoFile(null);
    setPhotoPreview(service.photo_url);
    setTempSupplements([]);
    setShowModal(true);
  };

  const handleDuplicate = async (service: Service) => {
    try {
      const { data: existingSupplements } = await supabase
        .from('service_supplements')
        .select('*')
        .eq('service_id', service.id);

      const { data: newService, error } = await supabase
        .from('services')
        .insert([{
          user_id: user?.id,
          name: `${service.name} (copie)`,
          description: service.description,
          service_type: service.service_type || 'prestation',
          category: service.category,
          duration: service.duration,
          price: service.price,
          status: service.status,
          recommended_frequency: service.recommended_frequency,
          has_vat: service.has_vat,
          photo_url: service.photo_url,
          special_offer: service.special_offer,
          offer_type: service.offer_type,
        }])
        .select()
        .single();

      if (error) throw error;

      if (newService && existingSupplements && existingSupplements.length > 0) {
        const supplementsData = existingSupplements.map(supp => ({
          service_id: newService.id,
          user_id: user?.id,
          name: supp.name,
          duration_minutes: supp.duration_minutes,
          price: supp.price
        }));

        await supabase
          .from('service_supplements')
          .insert(supplementsData);
      }

      fetchServices();
    } catch (error) {
      console.error('Error duplicating service:', error);
    }
  };


  const resetForm = () => {
    setShowModal(false);
    setEditingService(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setTempSupplements([]);
    setFormData({
      name: '',
      description: '',
      service_type: 'prestation',
      category: '',
      duration: '60',
      price: '',
      status: 'active',
      recommended_frequency: '',
      has_vat: false,
      photo_url: '',
      special_offer: '',
      offer_type: '',
    });
  };

  const safeServices = Array.isArray(services) ? services : [];

  const allCategories = Array.from(
    new Set(safeServices.map(s => s?.category || 'Autre').filter(Boolean))
  ).sort();

  const filteredServices = safeServices.filter(s => {
    if (!s) return false;
    const status = s.status || 'active';
    const matchesStatus = status === activeStatusTab;
    const matchesType = serviceTypeFilter === 'all' || (s.service_type || 'prestation') === serviceTypeFilter;
    const matchesCategory = categoryFilter === 'all' || (s.category || '') === categoryFilter;
    const matchesName = !serviceNameFilter || (s.name || '').toLowerCase().includes(serviceNameFilter.toLowerCase());
    return matchesStatus && matchesType && matchesCategory && matchesName;
  });

  const activeCount = safeServices.filter(s => s?.status === 'active').length;
  const hiddenCount = safeServices.filter(s => s?.status === 'hidden').length;
  const archivedCount = safeServices.filter(s => s?.status === 'archived').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackMessage="Une erreur est survenue sur la page Services. Veuillez recharger la page.">
      <div className="p-3 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gérez vos services et tarifs
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xs:inline">Nouveau service</span>
          <span className="xs:hidden">Nouveau</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveStatusTab('active')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeStatusTab === 'active'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Actif ({activeCount})
            </button>
            <button
              onClick={() => setActiveStatusTab('hidden')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeStatusTab === 'hidden'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Masqué ({hiddenCount})
            </button>
            <button
              onClick={() => setActiveStatusTab('archived')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeStatusTab === 'archived'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Archivé ({archivedCount})
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Type de service :</span>
              <button
                onClick={() => setServiceTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  serviceTypeFilter === 'all'
                    ? 'bg-belaya-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              {(SERVICE_TYPES || []).map(type => (
                <button
                  key={type.value}
                  onClick={() => setServiceTypeFilter(type.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    serviceTypeFilter === type.value
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="all">Tous</option>
                  {(allCategories || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher un service</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={serviceNameFilter}
                    onChange={(e) => setServiceNameFilter(e.target.value)}
                    placeholder="Nom du service..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {serviceTypeFilter === 'all' && categoryFilter === 'all' && !serviceNameFilter
                ? `Aucun service ${activeStatusTab === 'active' ? 'actif' : activeStatusTab === 'hidden' ? 'masqué' : 'archivé'}`
                : 'Aucun service ne correspond aux filtres sélectionnés'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Service</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Durée</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Prix</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fréquence</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredServices || []).map((service) => {
                    if (!service) return null;
                    const serviceType = service.service_type || 'prestation';
                    const typeTag = getServiceTypeTag(serviceType);

                    return (
                      <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {service.photo_url ? (
                              <img
                                src={service.photo_url}
                                alt={service.name || 'Service'}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{service.name || 'Sans nom'}</div>
                              {service.description && (
                                <div className="text-sm text-gray-500 line-clamp-1">
                                  {service.description}
                                </div>
                              )}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${typeTag.className}`}>
                                {typeTag.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {service.category || 'Autre'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {service.duration || 0} min
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{service.price || 0}€</div>
                          {service.has_vat && (
                            <div className="text-xs text-gray-500">TVA incluse</div>
                          )}
                          {service.supplements && service.supplements.length > 0 && (
                            <div className="mt-1.5">
                              <SupplementsDisplay
                                supplements={service.supplements}
                                serviceType={service.service_type}
                                variant="compact"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {service.recommended_frequency ? (
                            <span className="text-sm">
                              {service.recommended_frequency} jours
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Non définie</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(service)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(service)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Dupliquer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(service)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Modifier le service' : 'Nouveau service'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de prestation *
                  </label>
                  <select
                    required
                    value={formData.service_type}
                    onChange={(e) => setFormData({
                      ...formData,
                      service_type: e.target.value as ServiceType,
                      category: '',
                      recommended_frequency: (e.target.value === 'prestation') ? formData.recommended_frequency : null
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SERVICE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.service_type === 'formation' ? 'Nom de la formation *' : 'Nom du service *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={formData.service_type === 'formation' ? "Ex: Formation Gel UV Débutant" : "Ex: Pose complète ongles gel"}
                  />
                </div>

                {formData.service_type === 'prestation' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée (minutes) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.duration}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.startsWith('0') && value.length > 1) {
                          setFormData({ ...formData, duration: value.replace(/^0+/, '') });
                        } else {
                          setFormData({ ...formData, duration: value });
                        }
                      }}
                      placeholder="60"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div className={formData.service_type === 'prestation' ? '' : 'col-span-2'}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix (€) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.price}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                      }
                      if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                        value = value.replace(/^0+/, '');
                      }
                      setFormData({ ...formData, price: value });
                    }}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {formData.service_type === 'prestation' && (
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      Fréquence recommandée (jours)
                      <InfoTooltip content="Nombre de jours recommandés avant que la cliente revienne pour cette prestation." />
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.recommended_frequency}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.startsWith('0') && value.length > 1) {
                          setFormData({ ...formData, recommended_frequency: value.replace(/^0+/, '') });
                        } else {
                          setFormData({ ...formData, recommended_frequency: value });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: 21 pour 3 semaines"
                    />
                  </div>
                )}

                {(formData.service_type === 'prestation' || formData.service_type === 'formation') && (
                  <div className="col-span-2 border-t border-gray-200 pt-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      Offre promotionnelle
                      <InfoTooltip content="Créez une offre spéciale pour ce service qui sera visible sur votre profil public." />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Type d'offre</label>
                        <select
                          value={formData.offer_type}
                          onChange={(e) => setFormData({ ...formData, offer_type: e.target.value as '' | 'percentage' | 'fixed' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Pas d'offre</option>
                          <option value="percentage">Pourcentage (%)</option>
                          <option value="fixed">Montant fixe (€)</option>
                        </select>
                      </div>
                      {formData.offer_type && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            {formData.offer_type === 'percentage' ? 'Réduction (%)' : 'Réduction (€)'}
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formData.special_offer}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9.]/g, '');
                              const parts = value.split('.');
                              if (parts.length > 2) {
                                value = parts[0] + '.' + parts.slice(1).join('');
                              }
                              if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                                value = value.replace(/^0+/, '');
                              }
                              setFormData({ ...formData, special_offer: value });
                            }}
                            placeholder={formData.offer_type === 'percentage' ? 'Ex: 20 pour -20%' : 'Ex: 10 pour -10€'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(formData.service_type === 'prestation' || formData.service_type === 'formation') && (
                  <div className="col-span-2 border-t border-gray-200 pt-6">
                    {editingService ? (
                      <SupplementsManager
                        serviceId={editingService.id}
                        serviceType={editingService.service_type}
                        onSupplementsChange={fetchServices}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Suppléments (optionnels)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setTempSupplements([...tempSupplements, {
                                name: '',
                                duration_minutes: '',
                                price: ''
                              }]);
                            }}
                            className="text-sm text-belaya-primary hover:text-belaya-deep font-medium flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter un supplément
                          </button>
                        </div>

                        {tempSupplements.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">Aucun supplément pour le moment</p>
                        ) : (
                          <div className="space-y-3">
                            {tempSupplements.map((supplement, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-medium text-gray-700">Supplément #{index + 1}</label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTempSupplements(tempSupplements.filter((_, i) => i !== index));
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom du supplément *</label>
                                  <input
                                    type="text"
                                    value={supplement.name}
                                    onChange={(e) => {
                                      const updated = [...tempSupplements];
                                      updated[index].name = e.target.value;
                                      setTempSupplements(updated);
                                    }}
                                    placeholder="Ex: Baby Boomer"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                                  />
                                </div>
                                <div className={formData.service_type === 'prestation' ? 'grid grid-cols-2 gap-3' : ''}>
                                  {formData.service_type === 'prestation' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Durée (min) *</label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="0"
                                        value={supplement.duration_minutes}
                                        onChange={(e) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length > 0) {
                                            value = value.replace(/^0+/, '') || '0';
                                            if (value === '0' && e.target.value.length === 1) {
                                              value = '';
                                            }
                                          }
                                          const updated = [...tempSupplements];
                                          updated[index].duration_minutes = value;
                                          setTempSupplements(updated);
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Prix (€) *</label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0"
                                      value={supplement.price}
                                      onChange={(e) => {
                                        let value = e.target.value.replace(/[^0-9.]/g, '');
                                        const parts = value.split('.');
                                        if (parts.length > 2) {
                                          value = parts[0] + '.' + parts.slice(1).join('');
                                        }
                                        if (value.length > 0 && !value.startsWith('.')) {
                                          const beforeDot = value.split('.')[0];
                                          const afterDot = value.includes('.') ? '.' + value.split('.')[1] : '';
                                          const cleanedBeforeDot = beforeDot.replace(/^0+/, '') || (afterDot ? '0' : '');
                                          value = cleanedBeforeDot + afterDot;
                                        }
                                        const updated = [...tempSupplements];
                                        updated[index].price = value;
                                        setTempSupplements(updated);
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="col-span-2 border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo du service (optionnelle)
                  </label>
                  <div className="space-y-3">
                    {photoPreview && (
                      <div className="relative inline-block">
                        <img
                          src={photoPreview}
                          alt="Aperçu"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      {uploading && (
                        <span className="text-sm text-gray-600">Téléchargement...</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Formats acceptés: JPG, PNG, GIF. Taille max: 5 Mo.
                    </p>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez votre service..."
                  />
                </div>

                <div className="col-span-2 border-t border-gray-200 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_vat}
                      onChange={(e) => setFormData({ ...formData, has_vat: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      TVA applicable
                    </span>
                  </label>
                </div>

                <div className="col-span-2 border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Statut du service
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 text-belaya-bright border-gray-300 focus:ring-green-500"
                      />
                      <CheckCircle className="w-5 h-5 text-belaya-bright" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">Actif</span>
                        <p className="text-xs text-gray-500">Service visible partout</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        value="archived"
                        checked={formData.status === 'archived'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <Archive className="w-5 h-5 text-orange-600" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">Archivé</span>
                        <p className="text-xs text-gray-500">Ce service n'est plus d'actualité</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        value="hidden"
                        checked={formData.status === 'hidden'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <Eye className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">Masqué</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Service masqué de la liste client mais disponible en transaction</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingService ? 'Mettre à jour' : 'Créer le service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
