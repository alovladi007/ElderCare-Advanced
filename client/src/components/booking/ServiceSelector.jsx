import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Clock, Check } from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Input, Select } from '..';
import bookingService from '../../services/booking.service';

const ServiceSelector = ({ onSelectService }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getServices();
      setServices(data.filter((s) => s.isActive));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category) => {
    const variants = {
      ELDER_CARE: { variant: 'success', text: 'Elder Care' },
      HOME_CARE: { variant: 'info', text: 'Home Care' },
      MEDICAL: { variant: 'warning', text: 'Medical' },
      THERAPY: { variant: 'default', text: 'Therapy' },
    };
    return variants[category] || { variant: 'default', text: category };
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading services..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filter */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
              className="mb-0"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'ELDER_CARE', label: 'Elder Care' },
              { value: 'HOME_CARE', label: 'Home Care' },
              { value: 'MEDICAL', label: 'Medical' },
              { value: 'THERAPY', label: 'Therapy' },
            ]}
            className="mb-0 md:w-64"
          />
        </div>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <Card padding="lg" className="bg-white/10 backdrop-blur-md border-white/20 col-span-full">
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No services found</p>
            </div>
          </Card>
        ) : (
          filteredServices.map((service) => {
            const categoryBadge = getCategoryBadge(service.category);

            return (
              <Card
                key={service.id}
                padding="normal"
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white flex-1">
                      {service.name}
                    </h3>
                    <Badge variant={categoryBadge.variant}>{categoryBadge.text}</Badge>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 flex-1">
                    {service.description}
                  </p>

                  {/* Features */}
                  {service.features && Array.isArray(service.features) && (
                    <div className="mb-4">
                      <ul className="space-y-1">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-gray-300"
                          >
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Price and Duration */}
                  <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/10">
                    {service.price ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-white font-bold text-xl">
                          ${service.price}
                        </span>
                        {service.duration && (
                          <span className="text-gray-400 text-sm">/ {service.duration} min</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Contact for pricing</span>
                    )}

                    {service.duration && (
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} min</span>
                      </div>
                    )}
                  </div>

                  {/* Book Button */}
                  <Button
                    variant="primary"
                    onClick={() => onSelectService(service)}
                    className="w-full"
                  >
                    Book Now
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ServiceSelector;
