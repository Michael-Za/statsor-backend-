import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface Player {
  id?: string;
  number: number;
  name: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  position: string;
  age: number;
  nationality: string;
  height?: number | undefined;
  weight?: number | undefined;
  secondaryPositions?: string[];
  dominantFoot: string;
  birthDate: Date;
  date_of_birth?: string;
  goals: number;
  assists: number;
  games: number;
  minutes: number;
  yellowCards: number;
  redCards: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  foulsCommitted: number;
  foulsReceived: number;
  ballsLost: number;
  ballsRecovered: number;
  duelsWon: number;
  duelsLost: number;
  crosses: number;
  saves?: number;
  photo?: string;
  shotMap?: { [key: string]: number };
  email?: string;
  phone?: string;
  address?: string;
  contract_end?: string;
  salary?: number;
  fitness?: number;
  injuries?: string[];
  notes?: string;
  skills?: {
    technical: number;
    physical: number;
    tactical: number;
    mental: number;
  };
  medicalClearance?: boolean;
  lastMedicalCheck?: string;
  joinDate?: string;
  team_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddPlayerFormProps {
  player?: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Partial<Player>) => void;
}

const AddPlayerForm: React.FC<AddPlayerFormProps> = ({ player, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    first_name: '',
    last_name: '',
    nickname: '',
    birthDate: undefined as Date | undefined,
    date_of_birth: '',
    nationality: '',
    height: '',
    weight: '',
    position: '',
    secondaryPositions: [] as string[],
    dominantFoot: '',
    number: '',
    photo: '',
    email: '',
    phone: '',
    address: '',
    contract_end: '',
    salary: '',
    fitness: '85',
    injuries: '',
    notes: '',
    technical: '80',
    physical: '80',
    tactical: '80',
    mental: '80',
    medicalClearance: true,
    lastMedicalCheck: format(new Date(), "yyyy-MM-dd")
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Initialize form with player data when editing
  useEffect(() => {
    if (player && isOpen) {
      const firstName = player.first_name || player.name?.split(' ')[0] || '';
      const lastName = player.last_name || player.name?.split(' ').slice(1).join(' ') || '';
      
      setFormData({
        name: player.name || `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        nickname: player.nickname || '',
        birthDate: player.birthDate ? new Date(player.birthDate) : (player.date_of_birth ? new Date(player.date_of_birth) : undefined),
        date_of_birth: player.date_of_birth || (player.birthDate ? format(new Date(player.birthDate), "yyyy-MM-dd") : ''),
        nationality: player.nationality || '',
        height: player.height ? player.height.toString() : '',
        weight: player.weight ? player.weight.toString() : '',
        position: player.position || '',
        secondaryPositions: player.secondaryPositions || [],
        dominantFoot: player.dominantFoot || '',
        number: player.number ? player.number.toString() : '',
        photo: player.photo || '',
        email: player.email || '',
        phone: player.phone || '',
        address: player.address || '',
        contract_end: player.contract_end || '',
        salary: player.salary ? player.salary.toString() : '',
        fitness: player.fitness ? player.fitness.toString() : '85',
        injuries: player.injuries ? player.injuries.join(', ') : '',
        notes: player.notes || '',
        technical: player.skills?.technical ? player.skills.technical.toString() : '80',
        physical: player.skills?.physical ? player.skills.physical.toString() : '80',
        tactical: player.skills?.tactical ? player.skills.tactical.toString() : '80',
        mental: player.skills?.mental ? player.skills.mental.toString() : '80',
        medicalClearance: player.medicalClearance !== undefined ? player.medicalClearance : true,
        lastMedicalCheck: player.lastMedicalCheck || format(new Date(), "yyyy-MM-dd")
      });
      
      setPhotoPreview(player.photo || null);
    } else if (!isOpen) {
      // Reset form when closing
      setFormData({
        name: '',
        first_name: '',
        last_name: '',
        nickname: '',
        birthDate: undefined,
        date_of_birth: '',
        nationality: '',
        height: '',
        weight: '',
        position: '',
        secondaryPositions: [],
        dominantFoot: '',
        number: '',
        photo: '',
        email: '',
        phone: '',
        address: '',
        contract_end: '',
        salary: '',
        fitness: '85',
        injuries: '',
        notes: '',
        technical: '80',
        physical: '80',
        tactical: '80',
        mental: '80',
        medicalClearance: true,
        lastMedicalCheck: format(new Date(), "yyyy-MM-dd")
      });
      setPhotoPreview(null);
    }
  }, [player, isOpen]);

  const positions = [
    { value: 'POR', label: 'Portero' },
    { value: 'DEF', label: 'Defensa' },
    { value: 'CEN', label: 'Centrocampista' },
    { value: 'DEL', label: 'Delantero' }
  ];

  const countries = [
    'España', 'Francia', 'Alemania', 'Italia', 'Portugal', 'Brasil', 'Argentina', 
    'Inglaterra', 'Holanda', 'Bélgica', 'Croatia', 'México', 'Colombia', 'Uruguay',
    'United States', 'Canada', 'Australia', 'Japan', 'South Korea', 'China'
  ];

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photo: '' }));
  };

  const handleSave = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!formData.name || !formData.position || !formData.number) {
      alert('Por favor, completa los campos obligatorios: nombre, posición y número.');
      return;
    }

    const age = formData.birthDate ? calculateAge(formData.birthDate) : 25;
    const firstName = formData.first_name || formData.name.split(' ')[0] || '';
    const lastName = formData.last_name || formData.name.split(' ').slice(1).join(' ') || '';
    
    const playerData: any = {
      ...(player?.id ? { id: player.id } : {}),
      first_name: firstName,
      last_name: lastName,
      name: formData.name,
      nickname: formData.nickname || '',
      position: formData.position,
      age,
      nationality: formData.nationality,
      height: formData.height ? parseInt(formData.height) : undefined,
      weight: formData.weight ? parseInt(formData.weight) : undefined,
      secondaryPositions: formData.secondaryPositions,
      dominantFoot: formData.dominantFoot,
      birthDate: formData.birthDate,
      date_of_birth: formData.date_of_birth || (formData.birthDate ? format(formData.birthDate, "yyyy-MM-dd") : ''),
      number: parseInt(formData.number),
      photo: formData.photo || '',
      email: formData.email || '',
      phone: formData.phone || '',
      address: formData.address || '',
      contract_end: formData.contract_end || '',
      salary: formData.salary ? parseInt(formData.salary) : undefined,
      fitness: formData.fitness ? parseInt(formData.fitness) : 85,
      injuries: formData.injuries ? formData.injuries.split(',').map(i => i.trim()).filter(i => i) : [],
      notes: formData.notes || '',
      skills: {
        technical: formData.technical ? parseInt(formData.technical) : 80,
        physical: formData.physical ? parseInt(formData.physical) : 80,
        tactical: formData.tactical ? parseInt(formData.tactical) : 80,
        mental: formData.mental ? parseInt(formData.mental) : 80
      },
      medicalClearance: formData.medicalClearance,
      lastMedicalCheck: formData.lastMedicalCheck || format(new Date(), "yyyy-MM-dd"),
      goals: player?.goals || 0,
      assists: player?.assists || 0,
      games: player?.games || 0,
      minutes: player?.minutes || 0,
      yellowCards: player?.yellowCards || 0,
      redCards: player?.redCards || 0,
      shots: player?.shots || 0,
      shotsOnTarget: player?.shotsOnTarget || 0,
      passes: player?.passes || 0,
      passAccuracy: player?.passAccuracy || 0,
      foulsCommitted: player?.foulsCommitted || 0,
      foulsReceived: player?.foulsReceived || 0,
      ballsLost: player?.ballsLost || 0,
      ballsRecovered: player?.ballsRecovered || 0,
      duelsWon: player?.duelsWon || 0,
      duelsLost: player?.duelsLost || 0,
      crosses: player?.crosses || 0,
      saves: player?.saves || 0,
      shotMap: player?.shotMap || { 
        'top-left': 0, 'top-center': 0, 'top-right': 0, 
        'middle-left': 0, 'middle-center': 0, 'middle-right': 0, 
        'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0 
      }
    };

    onSave(playerData);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      first_name: '',
      last_name: '',
      nickname: '',
      birthDate: undefined,
      date_of_birth: '',
      nationality: '',
      height: '',
      weight: '',
      position: '',
      secondaryPositions: [],
      dominantFoot: '',
      number: '',
      photo: '',
      email: '',
      phone: '',
      address: '',
      contract_end: '',
      salary: '',
      fitness: '85',
      injuries: '',
      notes: '',
      technical: '80',
      physical: '80',
      tactical: '80',
      mental: '80',
      medicalClearance: true,
      lastMedicalCheck: format(new Date(), "yyyy-MM-dd")
    });
    setPhotoPreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {player ? 'Editar Jugador' : 'Añadir Nuevo Jugador'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* BLOQUE 1 - DATOS PERSONALES */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-blue-600 mb-4">Datos Personales</h3>
            
            {/* Foto del jugador */}
            <div className="mb-4 text-center">
              <div className="relative inline-block">
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Vista previa"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-gray-300"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -top-2 -right-2 rounded-full p-1 bg-white"
                      onClick={removePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center border-2 border-gray-300">
                    <Upload className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">Subir foto (opcional)</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Fernando Torres"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Nombre"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Apellidos"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apodo o nombre deportivo
                </label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="Ej: El Niño"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de nacimiento *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.birthDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birthDate ? format(formData.birthDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birthDate}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, birthDate: date }));
                        if (date) {
                          setFormData(prev => ({ ...prev, date_of_birth: format(date, "yyyy-MM-dd") }));
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date("1960-01-01")}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {formData.birthDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Edad: {calculateAge(formData.birthDate)} años
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nacionalidad
                </label>
                <Select value={formData.nationality} onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura (cm)
                  </label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="180"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg)
                  </label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="75"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jugador@ejemplo.com"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+34 600 123 456"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Dirección completa"
                  className="w-full"
                  rows={2}
                />
              </div>
            </div>
          </Card>

          {/* BLOQUE 2 - DATOS DEPORTIVOS */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-blue-600 mb-4">Datos Deportivos</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posición principal *
                </label>
                <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar posición" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label} ({pos.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pierna dominante
                </label>
                <Select value={formData.dominantFoot} onValueChange={(value) => setFormData(prev => ({ ...prev, dominantFoot: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar pierna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="izquierda">Izquierda</SelectItem>
                    <SelectItem value="derecha">Derecha</SelectItem>
                    <SelectItem value="ambidiestro">Ambidiestro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de dorsal *
                </label>
                <Input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="9"
                  min="1"
                  max="99"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de finalización de contrato
                  </label>
                  <Input
                    type="date"
                    value={formData.contract_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_end: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salario (€)
                  </label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="50000"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de fitness (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.fitness}
                  onChange={(e) => setFormData(prev => ({ ...prev, fitness: e.target.value }))}
                  placeholder="85"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lesiones (separadas por coma)
                </label>
                <Input
                  value={formData.injuries}
                  onChange={(e) => setFormData(prev => ({ ...prev, injuries: e.target.value }))}
                  placeholder="Esguince, Rotura de menisco"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Última revisión médica
                  </label>
                  <Input
                    type="date"
                    value={formData.lastMedicalCheck}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastMedicalCheck: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="medicalClearance"
                    checked={formData.medicalClearance}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicalClearance: e.target.checked }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="medicalClearance" className="text-sm font-medium text-gray-700">
                    Apto médico
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales sobre el jugador"
                  className="w-full"
                  rows={3}
                />
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Habilidades</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Técnicas
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.technical}
                      onChange={(e) => setFormData(prev => ({ ...prev, technical: e.target.value }))}
                      placeholder="80"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Físicas
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.physical}
                      onChange={(e) => setFormData(prev => ({ ...prev, physical: e.target.value }))}
                      placeholder="80"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tácticas
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tactical}
                      onChange={(e) => setFormData(prev => ({ ...prev, tactical: e.target.value }))}
                      placeholder="80"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mentales
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.mental}
                      onChange={(e) => setFormData(prev => ({ ...prev, mental: e.target.value }))}
                      placeholder="80"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 p-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSave(e)}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {player ? 'Actualizar jugador' : 'Guardar jugador'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerForm;