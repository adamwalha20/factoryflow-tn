export interface Employee {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  role: 'Administrator' | 'Production Manager' | 'Machine Operator' | 'Quality Controller' | 'Warehouse Operator';
  pin_code?: string;
  created_at: string;
}

export interface BonDeCommande {
  id: string;
  bc_number: string;
  customer: string;
  due_date: string | null;
  status: 'En attente' | 'En cours' | 'Terminé';
  mandrin_type?: string | null;
  carton_type?: string | null;
  epaisseur?: string | null;
  quantity?: number | null;
  article_reference?: string | null;
  article_designation?: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  reference: string;
  designation: string;
  category: 'Adhesive Tape' | 'Stretch Film' | 'Carton' | 'Mandrin' | 'Raw Material';
  width: number | null;
  length: number | null;
  unit: string | null;
  weight: number | null;
  barcode: string | null;
  created_at: string;
}

export interface ManufacturingOrder {
  id: string;
  po_number?: string | null;
  of_number: string;
  customer: string;
  article_id: string;
  quantity_planned: number;
  priority: 'Basse' | 'Moyenne' | 'Haute';
  status: 'Draft' | 'Planned' | 'In Production' | 'Completed' | 'Closed';
  due_date: string | null;
  observation?: string | null;
  mandrin_type?: string | null;
  planned_axes?: number | null;
  planned_cartons?: number | null;
  colisage?: string | null;
  adhesif_color?: string | null;
  carton_model?: string | null;
  palettisation?: number | null;
  machine_id?: string | null;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  created_at: string;
}

export interface ProductionEntry {
  id: string;
  of_id: string;
  machine_id: string;
  operator_id: string;
  raw_material_id?: string | null;
  roll_number?: string | null;
  good_quantity: number;
  scrap_quantity: number;
  jumbo_roll_quantity: number;
  axes_quantity?: number | null;
  cartons_quantity?: number | null;
  qc_metrage?: number | null;
  qc_poids?: number | null;
  is_conforme?: boolean | null;
  comments: string | null;
  created_at: string;
}

export interface Carton {
  id: string;
  carton_number: string;
  of_id: string;
  article_id: string;
  quantity: number;
  operator_id: string;
  qr_payload: any | null;
  status: 'Waiting' | 'Produced' | 'QC_Passed' | 'QC_Rejected' | 'In_Warehouse' | 'QC_In_Review';
  created_at: string;
}

export interface RawMaterial {
  id: string;
  reference: string;
  designation: string;
  category: 'Jumbo Roll' | 'Mandrin' | 'Carton' | 'Film';
  quantity_in_stock: number;
  unit: string;
  created_at: string;
}

export interface MaterialConsumption {
  id: string;
  production_entry_id: string;
  raw_material_id: string;
  consumed_quantity: number;
  remaining_quantity: number;
  yield_percentage: number;
  waste_percentage: number;
  created_at: string;
}

export interface MachineEvent {
  id: string;
  machine_id: string;
  status: 'Running' | 'Stopped' | 'Maintenance';
  event_time: string;
  operator_id: string;
}

export interface WarehouseMovement {
  id: string;
  carton_id: string;
  from_location: string | null;
  to_location: string | null;
  movement_type: 'Inbound' | 'Outbound' | 'Transfer';
  operator_id: string;
  created_at: string;
}
