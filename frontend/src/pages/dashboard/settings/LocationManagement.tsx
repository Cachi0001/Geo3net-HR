import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Globe,
  Navigation,
  Building,
  Clock,
  Users,
  MoreVertical,
  Search
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/api'

interface Location {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius_meters: number
  is_default: boolean
  is_active: boolean
  timezone: string
  created_at: string
  updated_at: string
}

interface LocationFormData {
  name: string
  address: string
  latitude: string
  longitude: string
  radius: string
}

const LocationManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: '100'
  })

  const queryClient = useQueryClient()

  // Initialize default location if none exists
  const initializeDefaultLocation = async () => {
    try {
      const response = await apiClient.getLocations()
      if (response.success && response.data && response.data.locations.length === 0) {
        // Create default company location
        await apiClient.createLocation({
          name: 'Go3net Main Office',
          address: '7, Francis Aghedo close, berger bus stop beside rain oil filling station',
          latitude: 6.5244, // Lagos coordinates (approximate)
          longitude: 3.3792,
          radius_meters: 100
        })
        queryClient.invalidateQueries({ queryKey: ['locations'] })
        toast.success('Default company location created')
      }
    } catch (error) {
      console.error('Error initializing default location:', error)
    }
  }

  // Initialize default location on component mount
  React.useEffect(() => {
    if (locationsData?.data?.locations?.length === 0) {
      initializeDefaultLocation()
    }
  }, [locationsData, initializeDefaultLocation])

  // Fetch locations
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await apiClient.getLocations()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch locations')
      }
      return response
    }
  })

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const response = await apiClient.createLocation({
        name: data.name,
        address: data.address,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        radius_meters: parseInt(data.radius)
      })
      if (!response.success) {
        throw new Error(response.error || 'Failed to create location')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setShowAddForm(false)
      resetForm()
      toast.success('Location created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<LocationFormData> }) => {
      const response = await apiClient.updateLocation(id, {
        name: data.name,
        address: data.address,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
        radius_meters: data.radius ? parseInt(data.radius) : undefined
      })
      if (!response.success) {
        throw new Error(response.error || 'Failed to update location')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setEditingLocation(null)
      resetForm()
      toast.success('Location updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteLocation(id)
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete location')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Set default location mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/settings/locations/${id}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to set default location')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Default location updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radius: '100'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.address || !formData.latitude || !formData.longitude) {
      toast.error('Please fill in all required fields')
      return
    }

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)
    const radius = parseInt(formData.radius)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Invalid latitude. Must be between -90 and 90')
      return
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('Invalid longitude. Must be between -180 and 180')
      return
    }

    if (isNaN(radius) || radius < 10 || radius > 10000) {
      toast.error('Invalid radius. Must be between 10 and 10000 meters')
      return
    }

    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data: formData })
    } else {
      createLocationMutation.mutate(formData)
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius_meters.toString()
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingLocation(null)
    resetForm()
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }))
          toast.success('Current location detected')
        },
        (error) => {
          toast.error('Failed to get current location')
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser')
    }
  }

  const locations = locationsData?.data?.locations || []
  const filteredLocations = locations.filter((location: Location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Office Locations</h2>
          <p className="text-muted-foreground">
            Manage office locations and geofencing for check-in verification
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Location</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </CardTitle>
            <CardDescription>
              Configure office location details and geofencing radius
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Main Office, Branch Office"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Full address"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="e.g., 40.7128"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="e.g., -74.0060"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Radius (meters) *</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="10"
                    max="10000"
                    value={formData.radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, radius: e.target.value }))}
                    placeholder="100"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="flex items-center space-x-2"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Use Current Location</span>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Click to automatically detect your current coordinates
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                >
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Locations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredLocations.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No locations found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No locations match your search.' : 'Get started by adding your first office location.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Location
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredLocations.map((location: Location) => (
            <Card key={location.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{location.name}</h3>
                    {location.is_default && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteLocationMutation.mutate(location.id)}
                      disabled={location.is_default}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{location.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Navigation className="h-4 w-4" />
                    <span>{location.radius_meters}m radius</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${
                      location.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm text-muted-foreground">
                      {location.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {!location.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefaultMutation.mutate(location.id)}
                      disabled={setDefaultMutation.isPending}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Set Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default LocationManagement