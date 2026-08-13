import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { WaterSystemLayout } from '@/components/hercules-sfms/WaterSystemLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Settings, 
  Database, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Play,
  Square,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

// ============ GATEWAY API CONFIGURATION ============
const GATEWAY_API_URL = 'http://localhost:5000/api'

// ============ TYPE DEFINITIONS ============
interface GatewayPLC {
  plc_id: string
  protocol: string
  ip: string
  port: number
  rack?: number
  slot?: number
  connected: boolean
  tags: GatewayTag[]
}

interface GatewayTag {
  tag_id: string
  db_number: number
  address: number
  data_type: string
  description?: string
}

interface GatewayStatus {
  plc_count: number
  plcs: Record<string, GatewayPLC>
}

interface GatewayDataPoint {
  tag_id: string
  plc_id: string
  value: any
  quality: string
  timestamp: number
}

interface PLCFormData {
  plc_id: string
  protocol: 's7' | 'modbus'
  ip: string
  port: number
  rack: number
  slot: number
}

interface TagFormData {
  tag_id: string
  db_number: number
  address: number
  data_type: string
  description: string
}

// ============ API FUNCTIONS ============
const gatewayApi = {
  // Get all PLCs status
  getStatus: async (): Promise<GatewayStatus> => {
    const res = await fetch(`${GATEWAY_API_URL}/plc/status`)
    if (!res.ok) throw new Error('Failed to fetch PLC status')
    return res.json()
  },

  // Add new PLC
  addPLC: async (config: any) => {
    const res = await fetch(`${GATEWAY_API_URL}/plc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    if (!res.ok) throw new Error('Failed to add PLC')
    return res.json()
  },

  // Remove PLC
  removePLC: async (plcId: string) => {
    const res = await fetch(`${GATEWAY_API_URL}/plc/${plcId}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error('Failed to remove PLC')
    return res.json()
  },

  // Poll specific PLC
  pollPLC: async (plcId: string): Promise<{ data: GatewayDataPoint[] }> => {
    const res = await fetch(`${GATEWAY_API_URL}/plc/${plcId}/poll`, {
      method: 'POST'
    })
    if (!res.ok) throw new Error('Failed to poll PLC')
    return res.json()
  },

  // Poll all PLCs
  pollAll: async (): Promise<{ data: GatewayDataPoint[] }> => {
    const res = await fetch(`${GATEWAY_API_URL}/poll/all`, {
      method: 'POST'
    })
    if (!res.ok) throw new Error('Failed to poll PLCs')
    return res.json()
  },

  // Start auto-polling
  startPolling: async (interval: number = 5) => {
    const res = await fetch(`${GATEWAY_API_URL}/polling/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval_sec: interval })
    })
    if (!res.ok) throw new Error('Failed to start polling')
    return res.json()
  },

  // Stop auto-polling
  stopPolling: async () => {
    const res = await fetch(`${GATEWAY_API_URL}/polling/stop`, {
      method: 'POST'
    })
    if (!res.ok) throw new Error('Failed to stop polling')
    return res.json()
  }
}

// ============ LIVE READINGS COMPONENT ============
interface LiveReadingsViewProps {
  plcId: string
}

function LiveReadingsView({ plcId }: LiveReadingsViewProps) {
  const { data: readings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['gateway-readings', plcId],
    queryFn: () => gatewayApi.pollPLC(plcId).then(res => res.data),
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const formatValue = (value: any, quality: string) => {
    if (quality === 'bad' || value === null || value === undefined) return 'N/A'
    
    if (typeof value === 'boolean') return value ? '✓ TRUE' : '✗ FALSE'
    if (typeof value === 'number') return value.toFixed(2)
    return value.toString()
  }

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  return (
    <Card className="bg-surface-sunken/30 border-border/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-400" />
            Live PLC Readings - {plcId}
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="border-border"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-normal">Gateway Connected</span>
            </div>
          </div>
        </CardTitle>
        <CardDescription className="text-[color:var(--text-muted)]">
          Real-time data from IoT Gateway - {plcId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-[color:var(--text-muted)]">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Reading from PLC...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-danger">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            Failed to read from PLC
          </div>
        ) : readings.length === 0 ? (
          <div className="text-center py-8 text-[color:var(--text-muted)]">
            <Database className="h-8 w-8 mx-auto mb-2" />
            No data available. Add tags to start monitoring.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-[color:var(--text-secondary)]">Tag ID</TableHead>
                  <TableHead className="text-[color:var(--text-secondary)]">Current Value</TableHead>
                  <TableHead className="text-[color:var(--text-secondary)]">Quality</TableHead>
                  <TableHead className="text-[color:var(--text-secondary)]">Last Update</TableHead>
                  <TableHead className="text-[color:var(--text-secondary)]">PLC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((reading: GatewayDataPoint) => (
                  <TableRow key={reading.tag_id} className="border-border hover:bg-surface-sunken/30">
                    <TableCell className="text-white font-medium">
                      {reading.tag_id}
                    </TableCell>
                    <TableCell className="font-mono text-cyan-400 text-lg">
                      {formatValue(reading.value, reading.quality)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reading.quality === 'good' ? 'default' : 'destructive'} 
                             className={reading.quality === 'good' ? 'bg-green-600/20 text-green-400 border-green-600/50' : ''}>
                        {reading.quality.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)] text-sm">
                      {getTimeAgo(reading.timestamp)}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-secondary)]">
                      {reading.plc_id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ ADD PLC DIALOG ============
function AddPLCDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<PLCFormData>({
    plc_id: '',
    protocol: 's7',
    ip: '',
    port: 102,
    rack: 0,
    slot: 3
  })
  const [tags, setTags] = useState<TagFormData[]>([])
  const [currentTag, setCurrentTag] = useState<TagFormData>({
    tag_id: '',
    db_number: 3,
    address: 0,
    data_type: 'real',
    description: ''
  })

  const queryClient = useQueryClient()

  const addPLCMutation = useMutation({
    mutationFn: () => gatewayApi.addPLC({
      ...formData,
      tags: tags.map(tag => ({
        tag_id: tag.tag_id,
        db_number: tag.db_number,
        address: tag.address,
        data_type: tag.data_type
      }))
    }),
    onSuccess: () => {
      toast.success('PLC added successfully!')
      queryClient.invalidateQueries({ queryKey: ['gateway-status'] })
      setOpen(false)
      setFormData({ plc_id: '', protocol: 's7', ip: '', port: 102, rack: 0, slot: 3 })
      setTags([])
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(`Failed to add PLC: ${error.message}`)
    }
  })

  const addTag = () => {
    if (!currentTag.tag_id) {
      toast.error('Tag ID is required')
      return
    }
    setTags([...tags, currentTag])
    setCurrentTag({ tag_id: '', db_number: 3, address: 0, data_type: 'real', description: '' })
    toast.success('Tag added to list')
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-2" />
          Add PLC
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-surface-sunken border-border">
        <DialogHeader>
          <DialogTitle className="text-white">Add New PLC to Gateway</DialogTitle>
          <DialogDescription className="text-[color:var(--text-muted)]">
            Configure PLC connection and tags for real-time monitoring
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* PLC Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">PLC Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[color:var(--text-secondary)]">PLC ID</Label>
                <Input
                  value={formData.plc_id}
                  onChange={(e) => setFormData({...formData, plc_id: e.target.value})}
                  placeholder="e.g., MASA_PLC_01"
                  className="bg-surface-sunken/50 border-border text-white"
                />
              </div>
              <div>
                <Label className="text-[color:var(--text-secondary)]">Protocol</Label>
                <Select value={formData.protocol} onValueChange={(value: any) => setFormData({...formData, protocol: value})}>
                  <SelectTrigger className="bg-surface-sunken/50 border-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s7">Siemens S7</SelectItem>
                    <SelectItem value="modbus">Modbus TCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[color:var(--text-secondary)]">IP Address</Label>
                <Input
                  value={formData.ip}
                  onChange={(e) => setFormData({...formData, ip: e.target.value})}
                  placeholder="192.168.1.100"
                  className="bg-surface-sunken/50 border-border text-white"
                />
              </div>
              <div>
                <Label className="text-[color:var(--text-secondary)]">Port</Label>
                <Input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                  className="bg-surface-sunken/50 border-border text-white"
                />
              </div>
              {formData.protocol === 's7' && (
                <>
                  <div>
                    <Label className="text-[color:var(--text-secondary)]">Rack</Label>
                    <Input
                      type="number"
                      value={formData.rack}
                      onChange={(e) => setFormData({...formData, rack: parseInt(e.target.value)})}
                      className="bg-surface-sunken/50 border-border text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[color:var(--text-secondary)]">Slot</Label>
                    <Input
                      type="number"
                      value={formData.slot}
                      onChange={(e) => setFormData({...formData, slot: parseInt(e.target.value)})}
                      className="bg-surface-sunken/50 border-border text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tag Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Add Tags</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[color:var(--text-secondary)]">Tag ID</Label>
                <Input
                  value={currentTag.tag_id}
                  onChange={(e) => setCurrentTag({...currentTag, tag_id: e.target.value})}
                  placeholder="e.g., Bin1_Qty_SP"
                  className="bg-surface-sunken/50 border-border text-white"
                />
              </div>
              <div>
                <Label className="text-[color:var(--text-secondary)]">Data Type</Label>
                <Select value={currentTag.data_type} onValueChange={(value) => setCurrentTag({...currentTag, data_type: value})}>
                  <SelectTrigger className="bg-surface-sunken/50 border-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real">REAL (Float)</SelectItem>
                    <SelectItem value="int">INT (16-bit)</SelectItem>
                    <SelectItem value="dint">DINT (32-bit)</SelectItem>
                    <SelectItem value="bool">BOOL</SelectItem>
                    <SelectItem value="word">WORD</SelectItem>
                    <SelectItem value="dword">DWORD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[color:var(--text-secondary)]">DB Number</Label>
                <Input
                  type="number"
                  value={currentTag.db_number}
                  onChange={(e) => setCurrentTag({...currentTag, db_number: parseInt(e.target.value)})}
                  className="bg-surface-sunken/50 border-border text-white"
                />
              </div>
              <div>
                <Label className="text-[color:var(--text-secondary)]">Address (Byte Offset)</Label>
                <Input
                  type="number"
                  value={currentTag.address}
                  onChange={(e) => setCurrentTag({...currentTag, address: parseInt(e.target.value)})}
                  className="bg-surface-sunken/50 border-border text-white"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[color:var(--text-secondary)]">Description (Optional)</Label>
                <Input
                  value={currentTag.description}
                  onChange={(e) => setCurrentTag({...currentTag, description: e.target.value})}
                  placeholder="Tag description"
                  className="bg-surface-sunken/50 border-border text-white"
                />
              </div>
            </div>
            <Button onClick={addTag} variant="outline" className="border-cyan-600 text-cyan-400">
              <Plus className="h-4 w-4 mr-2" />
              Add Tag to List
            </Button>
          </div>

          {/* Tags List */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Configured Tags ({tags.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tags.map((tag, index) => (
                  <div key={index} className="flex items-center justify-between bg-surface-sunken/30 p-3 rounded border border-border">
                    <div>
                      <span className="text-white font-mono">{tag.tag_id}</span>
                      <span className="text-[color:var(--text-muted)] text-sm ml-2">
                        DB{tag.db_number}.{tag.address} ({tag.data_type})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTag(index)}
                      className="text-danger hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={() => addPLCMutation.mutate()}
            disabled={!formData.plc_id || !formData.ip || tags.length === 0 || addPLCMutation.isPending}
            className="bg-brand hover:bg-brand-hover"
          >
            {addPLCMutation.isPending ? 'Adding...' : 'Add PLC'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ MAIN COMPONENT ============
export function PLCConfiguration() {
  const queryClient = useQueryClient()
  
  // Fetch gateway status
  const { data: gatewayStatus, isLoading, error } = useQuery({
    queryKey: ['gateway-status'],
    queryFn: gatewayApi.getStatus,
    refetchInterval: 10000 // Refresh every 10 seconds
  })

  const [selectedPLC, setSelectedPLC] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [pollingInterval, setPollingInterval] = useState(5)

  // Auto-select first PLC
  useMemo(() => {
    if (gatewayStatus && !selectedPLC && Object.keys(gatewayStatus.plcs).length > 0) {
      setSelectedPLC(Object.keys(gatewayStatus.plcs)[0])
    }
  }, [gatewayStatus, selectedPLC])

  // Start polling mutation
  const startPollingMutation = useMutation({
    mutationFn: () => gatewayApi.startPolling(pollingInterval),
    onSuccess: () => {
      toast.success(`Auto-polling started (every ${pollingInterval}s)`)
    },
    onError: () => {
      toast.error('Failed to start polling')
    }
  })

  // Stop polling mutation
  const stopPollingMutation = useMutation({
    mutationFn: gatewayApi.stopPolling,
    onSuccess: () => {
      toast.success('Auto-polling stopped')
    },
    onError: () => {
      toast.error('Failed to stop polling')
    }
  })

  // Remove PLC mutation
  const removePLCMutation = useMutation({
    mutationFn: (plcId: string) => gatewayApi.removePLC(plcId),
    onSuccess: () => {
      toast.success('PLC removed successfully')
      queryClient.invalidateQueries({ queryKey: ['gateway-status'] })
    },
    onError: () => {
      toast.error('Failed to remove PLC')
    }
  })

  const KPICards = () => {
    const plcs = gatewayStatus?.plcs || {}
    const connectedCount = Object.values(plcs).filter(p => p.connected).length
    const totalTags = Object.values(plcs).reduce((sum, plc) => sum + (plc.tags?.length || 0), 0)

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-surface-sunken/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[color:var(--text-secondary)] flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              Connected PLCs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{connectedCount}/{gatewayStatus?.plc_count || 0}</div>
            <p className="text-xs text-[color:var(--text-muted)]">Gateway PLCs</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[color:var(--text-secondary)] flex items-center gap-2">
              <Settings className="h-4 w-4 text-green-400" />
              Total Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalTags}</div>
            <p className="text-xs text-[color:var(--text-muted)]">Monitored data points</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[color:var(--text-secondary)] flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Polling Interval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pollingInterval}s</div>
            <p className="text-xs text-[color:var(--text-muted)]">Auto-refresh rate</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[color:var(--text-secondary)] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Gateway Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {isLoading ? 'Loading...' : error ? 'Offline' : 'Online'}
            </div>
            <p className="text-xs text-[color:var(--text-muted)]">
              {error ? 'Cannot connect' : 'Connected'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <WaterSystemLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <KPICards />

        <Tabs defaultValue="plcs" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-surface-sunken/50 border-border/50">
            <TabsTrigger value="plcs" className="data-[state=active]:bg-cyan-600">Gateway PLCs</TabsTrigger>
            <TabsTrigger value="readings" className="data-[state=active]:bg-cyan-600">Live Readings</TabsTrigger>
            <TabsTrigger value="control" className="data-[state=active]:bg-cyan-600">Polling Control</TabsTrigger>
          </TabsList>

          <TabsContent value="plcs" className="space-y-4">
            <Card className="bg-surface-sunken/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyan-400" />
                    Registered PLCs
                  </span>
                  <AddPLCDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['gateway-status'] })} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-[color:var(--text-muted)]">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Loading PLCs...
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-danger">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    Cannot connect to Gateway at {GATEWAY_API_URL}
                  </div>
                ) : Object.keys(gatewayStatus?.plcs || {}).length === 0 ? (
                  <div className="text-center py-8 text-[color:var(--text-muted)]">
                    <Database className="h-8 w-8 mx-auto mb-2" />
                    No PLCs configured. Add your first PLC to start monitoring.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-[color:var(--text-secondary)]">PLC ID</TableHead>
                        <TableHead className="text-[color:var(--text-secondary)]">Protocol</TableHead>
                        <TableHead className="text-[color:var(--text-secondary)]">IP:Port</TableHead>
                        <TableHead className="text-[color:var(--text-secondary)]">Tags</TableHead>
                        <TableHead className="text-[color:var(--text-secondary)]">Status</TableHead>
                        <TableHead className="text-[color:var(--text-secondary)]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(gatewayStatus?.plcs || {}).map(([id, plc]) => (
                        <TableRow key={id} className="border-border hover:bg-surface-sunken/30">
                          <TableCell className="text-white font-medium">{plc.plc_id}</TableCell>
                          <TableCell>
                            <Badge variant="default">{plc.protocol.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="text-[color:var(--text-secondary)] font-mono">
                            {plc.ip}:{plc.port}
                            {plc.rack !== undefined && <span className="ml-2 text-xs">R{plc.rack}/S{plc.slot}</span>}
                          </TableCell>
                          <TableCell className="text-[color:var(--text-secondary)]">{plc.tags?.length || 0} tags</TableCell>
                          <TableCell>
                            <Badge variant={plc.connected ? 'default' : 'destructive'}
                                   className={plc.connected ? 'bg-green-600/20 text-green-400 border-green-600/50' : ''}>
                              {plc.connected ? '🟢 CONNECTED' : '🔴 OFFLINE'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPLC(plc.plc_id)}
                                className="h-8 border-border"
                              >
                                <Activity className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removePLCMutation.mutate(plc.plc_id)}
                                className="h-8 border-border text-danger"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="readings" className="space-y-4">
            {selectedPLC ? (
              <LiveReadingsView plcId={selectedPLC} />
            ) : (
              <Card className="bg-surface-sunken/30 border-border/50">
                <CardContent className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto mb-4 text-[color:var(--text-muted)]" />
                  <p className="text-[color:var(--text-muted)]">Select a PLC from the Gateway PLCs tab to view live readings</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="control" className="space-y-4">
            <Card className="bg-surface-sunken/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Auto-Polling Control
                </CardTitle>
                <CardDescription className="text-[color:var(--text-muted)]">
                  Configure automatic PLC polling interval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[color:var(--text-secondary)]">Polling Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={pollingInterval}
                      onChange={(e) => setPollingInterval(parseInt(e.target.value))}
                      min={1}
                      max={60}
                      className="bg-surface-sunken/50 border-border text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => startPollingMutation.mutate()}
                    disabled={startPollingMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Auto-Polling
                  </Button>
                  <Button
                    onClick={() => stopPollingMutation.mutate()}
                    disabled={stopPollingMutation.isPending}
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Polling
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WaterSystemLayout>
  )
}

export default PLCConfiguration
