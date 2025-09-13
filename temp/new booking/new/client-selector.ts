// components/booking/new-booking/ClientSelector.tsx
import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Users, Save } from 'lucide-react'
import { Client } from '@/types'
import { ClientCard } from '../shared/ClientCard'

interface ClientSelectorProps {
  clients: Client[]
  selectedClient?: Client
  onClientSelect: (client: Client) => void
  isNewClient: boolean
  onNewClientToggle: (isNew: boolean) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  loading?: boolean
}

interface NewClientFormData {
  name: string
  email: string
  phone: string
  company: string
  clientType: 'individual' | 'smb' | 'enterprise'
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onClientSelect,
  isNewClient,
  onNewClientToggle,
  searchTerm,
  onSearchChange,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'bookings' | 'spent' | 'recent'>('name')
  const [filterTier, setFilterTier] = useState<'all' | 'individual' | 'smb' | 'enterprise'>('all')
  const [newClientData, setNewClientData] = useState<NewClientFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    clientType: 'individual'
  })

  const filteredAndSortedClients = useMemo(() => {
    return clients
      .filter((client) => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
        
        const matchesTier = filterTier === 'all' || client.tier === filterTier
        
        return matchesSearch && matchesTier
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'bookings':
            return b.totalBookings - a.totalBookings
          case 'spent':
            return (b.totalSpent || 0) - (a.totalSpent || 0)
          case 'recent':
            return new Date(b.lastBooking || 0).getTime() - new Date(a.lastBooking || 0).getTime()
          default:
            return a.name.localeCompare(b.name)
        }
      })
  }, [clients, searchTerm, filterTier, sortBy])

  const handleNewClientChange = (field: keyof NewClientFormData, value: string) => {
    setNewClientData(prev => ({ ...prev, [field]: value }))
  }

  const isNewClientValid = newClientData.name.trim() && newClientData.email.trim()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Selection
            </CardTitle>
            <CardDescription>Choose existing client or create new one</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={!isNewClient ? 'default' : 'outline'}
              size="sm"
              onClick={() => onNewClientToggle(false)}
              className="gap-2"
              disabled={loading}
            >
              <Users className="h-4 w-4" />
              Existing ({clients.length})
            </Button>
            <Button
              variant={isNewClient ? 'default' : 'outline'}
              size="sm"
              onClick={() => onNewClientToggle(true)}
              className="gap-2"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              New Client
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!isNewClient ? (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="bookings">Most Bookings</SelectItem>
                    <SelectItem value="spent">Highest Spend</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterTier} onValueChange={(value) => setFilterTier(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="smb">SMB</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                {(searchTerm || filterTier !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSearchChange('')
                      setFilterTier('all')
                    }}
                    className="text-gray-500"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Results Summary */}
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedClients.length} of {clients.length} clients
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            </div>

            {/* Client List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="flex justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedClients.length > 0 ? (
                filteredAndSortedClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onClick={onClientSelect}
                    isSelected={selectedClient?.id === client.id}
                    showStats={true}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No clients found</p>
                  <p className="text-sm">Try adjusting your search or create a new client</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onNewClientToggle(true)}
                    className="mt-3 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Client
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Creating New Client</p>
              <p className="text-xs text-blue-600 mt-1">
                Fill in the required information to create a new client profile
              </p>
            </div>

            {/* New Client Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newClientData.name}
                  onChange={(e) => handleNewClientChange('name', e.target.value)}
                  placeholder="Enter client full name"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => handleNewClientChange('email', e.target.value)}
                  placeholder="client@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <Input
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => handleNewClientChange('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                <Select 
                  value={newClientData.clientType} 
                  onValueChange={(value) => handleNewClientChange('clientType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="smb">Small/Medium Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name (Optional)
                </label>
                <Input
                  value={newClientData.company}
                  onChange={(e) => handleNewClientChange('company', e.target.value)}
                  placeholder="Company or organization name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Client Type Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Client Type Benefits:</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium text-gray-800">Individual</div>
                  <div className="text-gray-600">Personal services, basic support</div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium text-gray-800">SMB</div>
                  <div className="text-gray-600">Business packages, priority support</div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium text-gray-800">Enterprise</div>
                  <div className="text-gray-600">Premium services, dedicated support</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                className="gap-2" 
                disabled={!isNewClientValid || loading}
              >
                <Save className="h-4 w-4" />
                Save & Continue
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onNewClientToggle(false)}
                disabled={loading}
              >
                Use Existing Client
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ClientSelector