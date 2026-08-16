CREATE OR REPLACE FUNCTION public.sync_bc_status()
RETURNS TRIGGER AS $$
DECLARE
  v_bc_status TEXT;
  v_all_ofs_completed BOOLEAN;
  v_any_of_in_production BOOLEAN;
  v_po_number TEXT;
  v_po_numbers TEXT[];
BEGIN
  v_po_numbers := ARRAY[]::TEXT[];
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.po_number IS NOT NULL THEN
      v_po_numbers := array_append(v_po_numbers, OLD.po_number);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.po_number IS NOT NULL THEN
      v_po_numbers := array_append(v_po_numbers, NEW.po_number);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.po_number IS NOT NULL THEN
      v_po_numbers := array_append(v_po_numbers, OLD.po_number);
    END IF;
    IF NEW.po_number IS NOT NULL AND NEW.po_number != COALESCE(OLD.po_number, '') THEN
      v_po_numbers := array_append(v_po_numbers, NEW.po_number);
    END IF;
  END IF;

  FOREACH v_po_number IN ARRAY v_po_numbers
  LOOP
    SELECT 
      COALESCE(bool_and(status IN ('Completed', 'Closed')), false),
      COALESCE(bool_or(status = 'In Production'), false)
    INTO v_all_ofs_completed, v_any_of_in_production
    FROM public.manufacturing_orders
    WHERE po_number = v_po_number;
    
    IF NOT EXISTS (SELECT 1 FROM public.manufacturing_orders WHERE po_number = v_po_number) THEN
      v_bc_status := 'En attente';
    ELSIF v_all_ofs_completed THEN
      v_bc_status := 'Terminé';
    ELSIF v_any_of_in_production THEN
      v_bc_status := 'En cours';
    ELSE
      v_bc_status := 'En attente';
    END IF;
    
    UPDATE public.bons_de_commande
    SET status = v_bc_status
    WHERE bc_number = v_po_number;
  END LOOP;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_bc_status ON public.manufacturing_orders;
CREATE TRIGGER trigger_sync_bc_status
AFTER INSERT OR UPDATE OF status, po_number OR DELETE ON public.manufacturing_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_bc_status();
