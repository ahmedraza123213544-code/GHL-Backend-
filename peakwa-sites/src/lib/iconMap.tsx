import {
  Wrench,
  Zap,
  Droplets,
  Wind,
  Flame,
  Star,
  CheckCircle,
  Phone,
  Clock,
  MapPin,
  Shield,
  Award,
  Users,
  Settings,
  Home,
  Car,
  Truck,
  Building,
  Heart,
  Leaf,
  AlertTriangle,
  ThumbsUp,
  Package,
  RefreshCw,
  DollarSign,
  Search,
} from 'lucide-react';

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wrench: Wrench,
  zap: Zap,
  droplet: Droplets,
  droplets: Droplets,
  wind: Wind,
  flame: Flame,
  star: Star,
  check: CheckCircle,
  'check-circle': CheckCircle,
  phone: Phone,
  clock: Clock,
  'map-pin': MapPin,
  shield: Shield,
  award: Award,
  users: Users,
  settings: Settings,
  home: Home,
  car: Car,
  truck: Truck,
  building: Building,
  heart: Heart,
  leaf: Leaf,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertTriangle,
  'alarm-triangle': AlertTriangle,
  alarm: AlertTriangle,
  'thumbs-up': ThumbsUp,
  package: Package,
  'refresh-cw': RefreshCw,
  'dollar-sign': DollarSign,
  search: Search,
  heater: Flame,
  'air-conditioning': Wind,
  'trash-2': Wrench,
  pipe: Droplets,
  tools: Wrench,
  tool: Wrench,
  chat: Users,
  'check-square': CheckCircle,
};

export function getIcon(iconName: string, className?: string) {
  let cleanName = (iconName || 'wrench')
    .toLowerCase()
    .replace(/^lucide[-:\s]+/i, '')
    .replace(/lucide[-:\s]+/gi, '')
    .trim();

  if (cleanName.includes(' ')) {
    const parts = cleanName.split(/\s+/);
    cleanName = parts[parts.length - 1];
  }

  const IconComponent = iconMap[cleanName] || Wrench;
  return <IconComponent className={className || 'w-6 h-6'} />;
}
