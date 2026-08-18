import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { 
  Article, 
  ManufacturingOrder, 
  ProductionEntry, 
  Carton, 
  Employee,
  MachineEvent,
  BonDeCommande
} from '../types/mes';

interface MesStore {
  articles: Article[];
  orders: ManufacturingOrder[];
  cartons: Carton[];
  employees: Employee[];
  raw_materials: any[];
  production_entries: ProductionEntry[];
  bons_de_commande: BonDeCommande[];
  loading: boolean;
  error: string | null;

  fetchInitialData: () => Promise<void>;
  setupRealtime: () => void;
  
  // Articles
  addArticle: (data: Partial<Article>) => Promise<void>;
  updateArticle: (id: string, data: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  
  // Manufacturing Orders
  addOrder: (data: Partial<ManufacturingOrder>) => Promise<void>;
  updateOrder: (id: string, data: Partial<ManufacturingOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: ManufacturingOrder['status']) => Promise<void>;
  
  // Bons de Commande
  addBonDeCommande: (data: Partial<BonDeCommande>) => Promise<void>;
  updateBonDeCommande: (id: string, data: Partial<BonDeCommande>) => Promise<void>;
  deleteBonDeCommande: (id: string) => Promise<void>;
  generateOfsFromBc: (bcId: string) => Promise<any[]>;
  
  // Production Entries & Cartons
  addProductionEntry: (data: Partial<ProductionEntry>, generateCarton: boolean) => Promise<any>;
  deleteCarton: (id: string) => Promise<void>;
  
  // QA & Warehouse Flow
  fetchCartonByNumber: (cartonNumber: string) => Promise<Carton | null>;
  verifyCarton: (cartonId: string, cartonNumber: string, articleId: string, result: 'conforme' | 'non-conforme', defectDescription?: string, warehouseLocation?: string) => Promise<void>;
  stockCarton: (cartonId: string, warehouseLocation: string) => Promise<void>;
  markLotInReview: (cartonIds: string[]) => Promise<void>;
  verifyLot: (cartonIds: string[], lotNumber: string, articleId: string, result: 'conforme' | 'non-conforme', defectDescription?: string, warehouseLocation?: string, validatedQuantity?: number) => Promise<void>;
  stockLot: (cartonIds: string[], warehouseLocation: string) => Promise<void>;
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

export const useMesStore = create<MesStore>((set, get) => ({
  articles: [],
  orders: [],
  cartons: [],
  employees: [],
  raw_materials: [],
  production_entries: [],
  bons_de_commande: [],
  loading: false,
  error: null,

  fetchInitialData: async () => {
    set((state) => ({ 
      loading: state.orders.length === 0 && state.articles.length === 0, 
      error: null 
    }));
    try {
      const orgId = getActiveOrgId();
      const [articlesRes, ordersRes, cartonsRes, employeesRes, rawMaterialsRes, entriesRes, bcRes] = await Promise.all([
        (async () => {
          let allArticles: any[] = [];
          let hasMore = true;
          let from = 0;
          let to = 999;
          while (hasMore) {
            const { data, error } = await (supabase as any)
              .from('articles')
              .select('*')
              .eq('organization_id', orgId)
              .order('created_at', { ascending: false })
              .order('id', { ascending: true })
              .range(from, to);
            if (error) throw error;
            if (data && data.length > 0) {
              allArticles = [...allArticles, ...data];
              from += 1000;
              to += 1000;
            }
            if (!data || data.length < 1000) {
              hasMore = false;
            }
          }
          return { data: allArticles };
        })(),
        (supabase as any).from('manufacturing_orders').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
        (supabase as any).from('cartons').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
        (supabase as any).from('employees').select('*').eq('organization_id', orgId).order('first_name'),
        (supabase as any).from('raw_materials').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
        (supabase as any).from('production_entries').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
        (supabase as any).from('bons_de_commande').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
      ]);

      set({
        articles: articlesRes.data || [],
        orders: ordersRes.data || [],
        cartons: cartonsRes.data || [],
        employees: employeesRes.data || [],
        raw_materials: rawMaterialsRes.data || [],
        production_entries: entriesRes.data || [],
        bons_de_commande: bcRes.data || []
      });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  setupRealtime: () => {
    // Only setup if we haven't already
    const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:public_changes');
    if (existingChannel) return;

    // Use a single channel for all public changes to avoid "already subscribed" errors on hot-reloads or strict mode
    supabase.channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manufacturing_orders' }, () => {
        get().fetchInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cartons' }, () => {
        get().fetchInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_entries' }, () => {
        get().fetchInitialData();
      })
      .subscribe();
  },

  addArticle: async (data: Partial<Article>) => {
    try {
      const orgId = getActiveOrgId();
      const { data: newArticle, error } = await (supabase as any)
        .from('articles')
        .insert([{ organization_id: orgId, ...data }])
        .select()
        .single();
      
      if (error) throw error;
      set(state => ({ articles: [newArticle, ...state.articles] }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateArticle: async (id: string, data: Partial<Article>) => {
    try {
      const { data: updatedArticle, error } = await (supabase as any)
        .from('articles')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        articles: state.articles.map(a => a.id === id ? updatedArticle : a)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteArticle: async (id: string) => {
    try {
      // Clear FK references to avoid constraint violations if possible
      await (supabase as any).from('manufacturing_orders').update({ article_id: null }).eq('article_id', id);
      await (supabase as any).from('cartons').update({ article_id: null }).eq('article_id', id);

      const { error } = await (supabase as any)
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        articles: state.articles.filter(a => a.id !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  addOrder: async (data: Partial<ManufacturingOrder>) => {
    try {
      const orgId = getActiveOrgId();
      const { data: newOrder, error } = await (supabase as any)
        .from('manufacturing_orders')
        .insert([{ organization_id: orgId, ...data, status: data.status || 'Draft' }])
        .select()
        .single();
      
      if (error) throw error;
      set(state => ({ orders: [newOrder, ...state.orders] }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateOrder: async (id: string, data: Partial<ManufacturingOrder>) => {
    try {
      const existingOrder = get().orders.find(o => o.id === id);
      const updatePayload = { ...data };
      
      // Auto-revert status if quantity is increased manually
      if (
        existingOrder && 
        existingOrder.status === 'Completed' && 
        updatePayload.quantity_planned !== undefined && 
        Number(updatePayload.quantity_planned) > 0
      ) {
        updatePayload.status = 'In Production';
      }

      const { data: updatedOrder, error } = await (supabase as any)
        .from('manufacturing_orders')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        orders: state.orders.map(o => o.id === id ? updatedOrder : o)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteOrder: async (id: string) => {
    try {
      // Clear FK references to avoid constraint violations if possible
      await (supabase as any).from('production_entries').update({ of_id: null }).eq('of_id', id);
      await (supabase as any).from('cartons').update({ of_id: null }).eq('of_id', id);

      const { error } = await (supabase as any)
        .from('manufacturing_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        orders: state.orders.filter(o => o.id !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateOrderStatus: async (id: string, status: ManufacturingOrder['status']) => {
    try {
      const { error } = await (supabase as any)
        .from('manufacturing_orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  addBonDeCommande: async (data: Partial<BonDeCommande>) => {
    try {
      const orgId = getActiveOrgId();
      const { data: newBc, error } = await (supabase as any)
        .from('bons_de_commande')
        .insert([{ organization_id: orgId, ...data }])
        .select()
        .single();
      
      if (error) throw error;
      set(state => ({ bons_de_commande: [newBc, ...state.bons_de_commande] }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateBonDeCommande: async (id: string, data: Partial<BonDeCommande>) => {
    try {
      const { data: updatedBc, error } = await (supabase as any)
        .from('bons_de_commande')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        bons_de_commande: state.bons_de_commande.map(bc => bc.id === id ? updatedBc : bc)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteBonDeCommande: async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('bons_de_commande')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        bons_de_commande: state.bons_de_commande.filter(bc => bc.id !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  generateOfsFromBc: async (bcId: string) => {
    try {
      const orgId = getActiveOrgId();
      const bc = get().bons_de_commande.find(b => b.id === bcId);
      if (!bc) throw new Error('Bon de commande non trouvé');

      const items = (bc.items && bc.items.length > 0) 
        ? bc.items 
        : [{
            article_reference: bc.article_reference || '',
            article_designation: bc.article_designation || '',
            quantity: bc.quantity || 0,
            unit: 'RLX',
            colisage: 36,
            mandrin_type: bc.mandrin_type || '',
            carton_type: bc.carton_type || '',
            epaisseur: bc.epaisseur || ''
          }];

      const createdOrders: any[] = [];
      const updatedItems = [...items];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.article_reference && !item.article_designation) continue;

        // Skip if OF already created
        if (item.of_id) continue;

        // Match or create article
        let article = get().articles.find(a => 
          (item.article_reference && a.reference?.toLowerCase() === item.article_reference.toLowerCase()) ||
          (item.article_designation && a.designation?.toLowerCase() === item.article_designation.toLowerCase())
        );

        if (!article && item.article_reference) {
          const { data: newArt } = await (supabase as any)
            .from('articles')
            .insert([{
              organization_id: orgId,
              reference: item.article_reference,
              designation: item.article_designation || item.article_reference,
              category: 'Adhesive Tape',
              unit: item.unit || 'RLX'
            }])
            .select()
            .single();
          if (newArt) {
            article = newArt;
            set(state => ({ articles: [newArt, ...state.articles] }));
          }
        }

        if (!article) continue;

        const ofNumber = items.length > 1 
          ? `OF-${bc.bc_number}-${i + 1}` 
          : `OF-${bc.bc_number}`;

        const ofPayload = {
          organization_id: orgId,
          of_number: ofNumber,
          customer: bc.customer,
          article_id: article.id,
          quantity_planned: item.quantity || bc.quantity || 0,
          priority: 'Moyenne',
          status: 'Planned',
          due_date: bc.due_date,
          bc_id: bc.id,
          bc_number: bc.bc_number,
          colisage: `${item.colisage || 36}`,
          mandrin_type: item.mandrin_type || bc.mandrin_type || null,
          carton_model: item.carton_type || bc.carton_type || null,
          observation: `Généré depuis BC ${bc.bc_number} | Réf: ${item.article_reference} (${item.quantity} ${item.unit || 'RLX'})`
        };

        const { data: newOf, error: ofErr } = await (supabase as any)
          .from('manufacturing_orders')
          .insert([ofPayload])
          .select()
          .single();

        if (!ofErr && newOf) {
          createdOrders.push(newOf);
          updatedItems[i] = {
            ...item,
            of_id: newOf.id,
            of_number: newOf.of_number
          };
        }
      }

      // Update BC with linked OF references in items and mark as En cours
      await (supabase as any)
        .from('bons_de_commande')
        .update({ items: updatedItems, status: 'En cours' })
        .eq('id', bcId);

      // Refresh store state
      await get().fetchInitialData();
      return createdOrders;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  addProductionEntry: async (data: Partial<ProductionEntry>, generateCarton: boolean) => {
    try {
      const orgId = getActiveOrgId();
      const { pieces_per_carton, carton_capacity, colisage, operator_ids, ...sanitizedEntryData } = data as any;

      // Safely verify and resolve valid operator_id for foreign key constraints
      let validOperatorId = sanitizedEntryData.operator_id;
      if (validOperatorId) {
        try {
          const { data: empCheck } = await (supabase as any)
            .from('employees')
            .select('id')
            .eq('id', validOperatorId)
            .maybeSingle();

          if (!empCheck) {
            const { data: empByUser } = await (supabase as any)
              .from('employees')
              .select('id')
              .eq('user_id', validOperatorId)
              .maybeSingle();

            if (empByUser) {
              validOperatorId = empByUser.id;
            } else {
              // Create employee record for this user if missing
              const { data: uData } = await (supabase as any)
                .from('users')
                .select('*')
                .eq('id', validOperatorId)
                .maybeSingle();

              if (uData) {
                const names = (uData.name || 'Opérateur').split(' ');
                const { data: newEmp } = await (supabase as any)
                  .from('employees')
                  .insert([{
                    id: validOperatorId,
                    user_id: validOperatorId,
                    organization_id: orgId,
                    first_name: names[0] || 'Opérateur',
                    last_name: names.slice(1).join(' ') || 'Atelier',
                    email: uData.email,
                    role: uData.role || 'Machine Operator',
                    is_active: true
                  }])
                  .select('id')
                  .maybeSingle();

                if (newEmp) validOperatorId = newEmp.id;
              } else {
                validOperatorId = null;
              }
            }
          }
        } catch {
          validOperatorId = null;
        }
      }

      sanitizedEntryData.operator_id = validOperatorId;

      const { data: newEntry, error } = await (supabase as any)
        .from('production_entries')
        .insert([{ organization_id: orgId, ...sanitizedEntryData }])
        .select()
        .single();
      
      if (error) throw error;

      // Automatically reduce the remaining quantity of the OF
      if (data.of_id && data.good_quantity && data.good_quantity > 0) {
        const order = get().orders.find(o => o.id === data.of_id);
        if (order) {
          const newQty = Math.max(0, Number(order.quantity_planned) - data.good_quantity);
          const updateData: any = { quantity_planned: newQty };
          
          if (newQty === 0 && order.status !== 'Completed') {
            updateData.status = 'Completed';
            
            // Insert notification
            await (supabase as any)
              .from('notifications')
              .insert([{
                organization_id: orgId,
                title: 'OF Terminé',
                message: `L'Ordre de Fabrication N° ${order.of_number} est terminé.`,
                read: false
              }]);
          }

          await (supabase as any)
            .from('manufacturing_orders')
            .update(updateData)
            .eq('id', data.of_id);
        }
      }

      if (generateCarton && data.good_quantity && data.good_quantity > 0) {
        let piecesLeftToDistribute = data.good_quantity;
        const orderForColisage = get().orders.find(o => o.id === data.of_id);
        const passedColisage = (data as any).pieces_per_carton || (data as any).carton_capacity || (data as any).colisage;
        const localColisage = typeof localStorage !== 'undefined' ? localStorage.getItem(`of_colisage_${data.of_id}`) : null;
        const parsedOrderColisage = orderForColisage?.colisage ? parseInt(String(orderForColisage.colisage).replace(/[^0-9]/g, '')) : null;
        const piecesPerCarton = Math.max(1, Number(passedColisage) || Number(localColisage) || parsedOrderColisage || 36);
        
        let articleId = orderForColisage?.article_id;
        if (!articleId && data.of_id) {
          try {
            const { data: ofData } = await (supabase as any)
              .from('manufacturing_orders')
              .select('article_id')
              .eq('id', data.of_id)
              .maybeSingle();
            if (ofData?.article_id) articleId = ofData.article_id;
          } catch {}
        }

        // Try to find an incomplete carton for this OF
        const { data: incompleteCartons } = await (supabase as any)
          .from('cartons')
          .select('*')
          .eq('of_id', data.of_id)
          .lt('quantity', piecesPerCarton)
          .eq('status', 'Waiting')
          .order('created_at', { ascending: false })
          .limit(1);

        if (incompleteCartons && incompleteCartons.length > 0) {
          const incompleteCarton = incompleteCartons[0];
          const neededToFill = piecesPerCarton - incompleteCarton.quantity;
          
          if (piecesLeftToDistribute >= neededToFill) {
            // Fill it up completely
            const now = new Date().toISOString();
            await (supabase as any)
              .from('cartons')
              .update({ quantity: piecesPerCarton, status: 'Produced', created_at: now, operator_id: validOperatorId })
              .eq('id', incompleteCarton.id);
              
            piecesLeftToDistribute -= neededToFill;
            
            // Update local state
            set(state => ({
              cartons: state.cartons.map(c => c.id === incompleteCarton.id ? { ...c, quantity: piecesPerCarton, status: 'Produced', created_at: now, operator_id: validOperatorId } : c)
            }));
          } else {
            // Add what we have, but it won't be full
            await (supabase as any)
              .from('cartons')
              .update({ quantity: incompleteCarton.quantity + piecesLeftToDistribute, operator_id: validOperatorId })
              .eq('id', incompleteCarton.id);
            
            // Update local state
            set(state => ({
              cartons: state.cartons.map(c => c.id === incompleteCarton.id ? { ...c, quantity: incompleteCarton.quantity + piecesLeftToDistribute, operator_id: validOperatorId } : c)
            }));
            
            piecesLeftToDistribute = 0;
          }
        }

        if (piecesLeftToDistribute > 0) {
          const numberOfFullCartons = Math.floor(piecesLeftToDistribute / piecesPerCarton);
          const remainder = piecesLeftToDistribute % piecesPerCarton;
          
          const cartonsToInsert = [];
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const todayPrefix = `CARTON-${dateStr}-`;
          const todaysCartons = get().cartons.filter(c => c.carton_number?.startsWith(todayPrefix));

          // Fetch database cartons for today to guarantee unique sequential numbering
          let maxCounter = 0;
          try {
            const { data: recentDbCartons } = await (supabase as any)
              .from('cartons')
              .select('carton_number')
              .like('carton_number', `${todayPrefix}%`)
              .order('created_at', { ascending: false })
              .limit(100);

            const allTodayCartons = [...todaysCartons, ...(recentDbCartons || [])];
            for (const c of allTodayCartons) {
              const parts = (c.carton_number || '').split('-');
              const num = parseInt(parts[parts.length - 1] || '0', 10);
              if (!isNaN(num) && num > maxCounter) {
                maxCounter = num;
              }
            }
          } catch {
            for (const c of todaysCartons) {
              const parts = (c.carton_number || '').split('-');
              const num = parseInt(parts[parts.length - 1] || '0', 10);
              if (!isNaN(num) && num > maxCounter) {
                maxCounter = num;
              }
            }
          }

          let cartonCounter = maxCounter + 1;
          for (let i = 0; i < numberOfFullCartons; i++) {
            const cartonNumber = `CARTON-${dateStr}-${cartonCounter}`;
            cartonsToInsert.push({
              organization_id: orgId,
              carton_number: cartonNumber,
              of_id: data.of_id,
              article_id: articleId || null,
              quantity: piecesPerCarton,
              operator_id: validOperatorId,
              qr_payload: { carton: cartonNumber, of: data.of_id, qty: piecesPerCarton },
              status: 'Produced'
            });
            cartonCounter++;
          }
          
          if (remainder > 0) {
            const cartonNumber = `CARTON-${dateStr}-${cartonCounter}`;
            cartonsToInsert.push({
              organization_id: orgId,
              carton_number: cartonNumber,
              of_id: data.of_id,
              article_id: articleId || null,
              quantity: remainder,
              operator_id: validOperatorId,
              qr_payload: { carton: cartonNumber, of: data.of_id, qty: remainder },
              status: 'Waiting'
            });
            cartonCounter++;
          }

          if (cartonsToInsert.length > 0) {
            const { data: newCartons, error: cartonError } = await (supabase as any)
              .from('cartons')
              .insert(cartonsToInsert)
              .select();

            if (cartonError) throw cartonError;
            set(state => ({ cartons: [...(newCartons || []), ...state.cartons] }));
            return newCartons;
          }
        }
      }
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteCarton: async (id: string) => {
    try {
      // 1. Fetch the carton to get its quantity and OF
      const carton = get().cartons.find(c => c.id === id);

      // 2. Clear FK references to avoid constraint violations if possible
      await (supabase as any).from('warehouse_movements').delete().eq('carton_id', id);

      // 3. Delete the carton
      const { error } = await (supabase as any)
        .from('cartons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 3.5 Delete matching production entry in historique production
      if (carton) {
        const matchingEntry = get().production_entries.find(
          entry => entry.of_id === carton.of_id && 
                   entry.good_quantity === carton.quantity && 
                   Math.abs(new Date(entry.created_at).getTime() - new Date(carton.created_at).getTime()) < 5000
        );
        
        if (matchingEntry) {
           await (supabase as any).from('production_entries').delete().eq('id', matchingEntry.id);
           set(state => ({
             production_entries: state.production_entries.filter(e => e.id !== matchingEntry.id)
           }));
        }
      }

      // 4. Restore the quantity to the OF (Reste à produire)
      if (carton && carton.of_id && carton.quantity) {
        const order = get().orders.find(o => o.id === carton.of_id);
        if (order) {
           const restoredQty = Number(order.quantity_planned) + Number(carton.quantity);
           const updateData: any = { quantity_planned: restoredQty };

           // If it was completed, but now we restored quantity, put it back to 'In Production'
           if (restoredQty > 0 && order.status === 'Completed') {
             updateData.status = 'In Production';
           }

           await (supabase as any)
             .from('manufacturing_orders')
             .update(updateData)
             .eq('id', carton.of_id);
             
           // Also update local store so UI reflects immediately without wait for realtime
           set(state => ({
             orders: state.orders.map(o => o.id === carton.of_id ? { ...o, ...updateData } : o)
           }));
        }
      }

      set(state => ({
        cartons: state.cartons.filter(c => c.id !== id)
      }));
    } catch (err: any) {
      throw err;
    }
  },

  fetchCartonByNumber: async (cartonNumber: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('cartons')
        .select('*')
        .eq('carton_number', cartonNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (err: any) {
      console.error("Error fetching carton:", err);
      return null;
    }
  },

  verifyCarton: async (cartonId: string, cartonNumber: string, articleId: string, result: 'conforme' | 'non-conforme', defectDescription?: string, warehouseLocation?: string) => {
    try {
      // 0. If rejected, add quantity back to OF
      if (result === 'non-conforme') {
        const carton = get().cartons.find(c => c.id === cartonId);
        if (carton) {
          const order = get().orders.find(o => o.id === carton.of_id);
          if (order) {
            const newQty = Number(order.quantity_planned) + carton.quantity;
            const updateData: any = { quantity_planned: newQty };
            if (order.status === 'Completed') updateData.status = 'In Production';
            
            await (supabase as any)
              .from('manufacturing_orders')
              .update(updateData)
              .eq('id', order.id);
            
            set(state => ({
              orders: state.orders.map(o => o.id === order.id ? { ...o, ...updateData } : o)
            }));
          }
        }
      }

      // 1. Update Carton Status
      const newStatus = result === 'conforme' ? (warehouseLocation ? 'In_Warehouse' : 'QC_Passed') : 'QC_Rejected';
      const { error: cartonError } = await (supabase as any)
        .from('cartons')
        .update({ status: newStatus })
        .eq('id', cartonId);
      
      if (cartonError) throw cartonError;

      // 2. Log Quality Inspection (using lot_number to store carton_number)
      try {
        const orgId = getActiveOrgId();
        const qcPayload = {
          organization_id: orgId,
          product_id: articleId || null,
          lot_number: cartonNumber,
          result: result,
          defect_description: defectDescription || null
        };
        const { error: err1 } = await (supabase as any).from('quality_controls').insert([qcPayload]);
        if (err1) {
          await (supabase as any).from('quality_inspections').insert([{ ...qcPayload, article_id: articleId }]);
        }
      } catch (logErr) {
        console.warn('Quality log notice:', logErr);
      }

      // 3. Log Warehouse Movement if conforme and location provided
      if (result === 'conforme' && warehouseLocation) {
        const { error: whError } = await (supabase as any)
          .from('warehouse_movements')
          .insert([{
            carton_id: cartonId,
            to_location: warehouseLocation,
            movement_type: 'Transfer'
          }]);
          
        if (whError) throw whError;
      }

      // 4. Update local state
      set(state => ({
        cartons: state.cartons.map(c => c.id === cartonId ? { ...c, status: newStatus as any } : c)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  stockCarton: async (cartonId: string, warehouseLocation: string) => {
    try {
      // 1. Update Carton Status
      const { error: cartonError } = await (supabase as any)
        .from('cartons')
        .update({ status: 'In_Warehouse' })
        .eq('id', cartonId);
      
      if (cartonError) throw cartonError;

      // 2. Log Warehouse Movement
      const { error: whError } = await (supabase as any)
        .from('warehouse_movements')
        .insert([{
          carton_id: cartonId,
          to_location: warehouseLocation,
          movement_type: 'Transfer'
        }]);
        
      if (whError) throw whError;

      // 3. Update local state
      set(state => ({
        cartons: state.cartons.map(c => c.id === cartonId ? { ...c, status: 'In_Warehouse' } : c)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  markLotInReview: async (cartonIds: string[]) => {
    set({ loading: true, error: null });
    try {
      if (cartonIds.length === 0) return;
      
      const { error } = await (supabase as any)
        .from('cartons')
        .update({ status: 'QC_In_Review' })
        .in('id', cartonIds);
        
      if (error) throw error;
      
      set(state => ({
        cartons: state.cartons.map(c => cartonIds.includes(c.id) ? { ...c, status: 'QC_In_Review' } : c)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  verifyLot: async (cartonIds: string[], lotNumber: string, articleId: string, result: 'conforme' | 'non-conforme', defectDescription?: string, warehouseLocation?: string, validatedQuantity?: number) => {
    try {
      if (cartonIds.length === 0) return;
      
      const cartonsInLot = get().cartons.filter(c => cartonIds.includes(c.id));
      const originalTotalQty = cartonsInLot.reduce((acc, c) => acc + (c.quantity || 0), 0);
      const orderForColisage = cartonsInLot.length > 0 ? get().orders.find(o => o.id === cartonsInLot[0].of_id) : null;
      const colisage = parseInt(orderForColisage?.colisage || '36');
      
      // Calculate quantity to refund to OF (either completely rejected, or partially validated)
      let qtyToRefund = 0;
      if (result === 'non-conforme') {
        qtyToRefund = originalTotalQty;
      } else if (result === 'conforme' && validatedQuantity !== undefined && validatedQuantity < originalTotalQty) {
        qtyToRefund = originalTotalQty - validatedQuantity;
      }
      
      // 0. If rejected or partially validated, add difference back to OF
      if (qtyToRefund > 0) {
        if (cartonsInLot.length > 0) {
          const order = get().orders.find(o => o.id === cartonsInLot[0].of_id);
          if (order) {
            const newQty = Number(order.quantity_planned) + qtyToRefund;
            const updateData: any = { quantity_planned: newQty };
            if (order.status === 'Completed') updateData.status = 'In Production';
            
            await (supabase as any)
              .from('manufacturing_orders')
              .update(updateData)
              .eq('id', order.id);
            
            set(state => ({
              orders: state.orders.map(o => o.id === order.id ? { ...o, ...updateData } : o)
            }));
          }
        }
        
        // Deduct from cartons
        let remainingRefund = qtyToRefund;
        
        
        const sortedCartons = [...cartonsInLot].sort((a, b) => {
          const aIsPartial = a.quantity < colisage;
          const bIsPartial = b.quantity < colisage;
          
          if (aIsPartial && !bIsPartial) return -1;
          if (!aIsPartial && bIsPartial) return 1;
          
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        for (const carton of sortedCartons) {
          if (remainingRefund <= 0) break;
          
          const qtyToDeduct = Math.min(carton.quantity, remainingRefund);
          const newQty = carton.quantity - qtyToDeduct;
          
          if (newQty === 0) {
            await (supabase as any)
              .from('cartons')
              .delete()
              .eq('id', carton.id);
              
            set(state => ({
              cartons: state.cartons.filter(c => c.id !== carton.id)
            }));
          } else {
            await (supabase as any)
              .from('cartons')
              .update({ quantity: newQty })
              .eq('id', carton.id);
              
            set(state => ({
              cartons: state.cartons.map(c => c.id === carton.id ? { ...c, quantity: newQty } : c)
            }));
          }
            
          remainingRefund -= qtyToDeduct;
        }
      }

      // 1. Update Cartons Status (Only update cartons that still have quantity > 0)
      const currentCartons = get().cartons.filter(c => cartonIds.includes(c.id) && c.quantity > 0);
      
      const newStatusFull = result === 'conforme' ? (warehouseLocation ? 'In_Warehouse' : 'QC_Passed') : 'QC_Rejected';
      const partialStatus = result === 'conforme' ? 'Waiting' : 'QC_Rejected';
      
      const fullCartons = currentCartons.filter(c => c.quantity >= colisage).map(c => c.id);
      const partialCartons = currentCartons.filter(c => c.quantity < colisage).map(c => c.id);

      if (fullCartons.length > 0) {
        const { error: cartonError } = await (supabase as any)
          .from('cartons')
          .update({ status: newStatusFull })
          .in('id', fullCartons);
        if (cartonError) throw cartonError;
      }

      if (partialCartons.length > 0) {
        const { error: cartonError } = await (supabase as any)
          .from('cartons')
          .update({ status: partialStatus })
          .in('id', partialCartons);
        if (cartonError) throw cartonError;
      }
      
      // Update local state just in case realtime is slow
      set(state => ({
        cartons: state.cartons.map(c => {
          if (fullCartons.includes(c.id)) return { ...c, status: newStatusFull };
          if (partialCartons.includes(c.id)) return { ...c, status: partialStatus };
          return c;
        })
      }));

      // 2. Log Quality Inspection for the LOT
      try {
        const orgId = getActiveOrgId();
        const orderForMachine = cartonsInLot.length > 0 ? get().orders.find(o => o.id === cartonsInLot[0].of_id) : null;
        const validQty = validatedQuantity !== undefined ? validatedQuantity : originalTotalQty;
        const qcPayload = {
          organization_id: orgId,
          product_id: articleId || null,
          lot_number: lotNumber,
          result: result,
          machine_id: orderForMachine?.machine_id || null,
          defect_description: defectDescription || null,
          validated_qty: validQty
        };
        const { error: err1 } = await (supabase as any).from('quality_controls').insert([qcPayload]);
        if (err1) {
          await (supabase as any).from('quality_inspections').insert([{ ...qcPayload, article_id: articleId, validated_quantity: validQty }]);
        }
      } catch (logErr) {
        console.warn('Quality lot log notice:', logErr);
      }

      // 3. Log Warehouse Movements if conforme and location provided
      if (result === 'conforme' && warehouseLocation && fullCartons.length > 0) {
        const movements = fullCartons.map(id => ({
          carton_id: id,
          to_location: warehouseLocation,
          movement_type: 'Transfer'
        }));
        const { error: whError } = await (supabase as any)
          .from('warehouse_movements')
          .insert(movements);
          
        if (whError) throw whError;
      }

    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  stockLot: async (cartonIds: string[], warehouseLocation: string) => {
    try {
      if (cartonIds.length === 0) return;
      
      // 1. Update Cartons Status
      const { error: cartonError } = await (supabase as any)
        .from('cartons')
        .update({ status: 'In_Warehouse' })
        .in('id', cartonIds);
      
      if (cartonError) throw cartonError;

      // 2. Log Warehouse Movements
      const movements = cartonIds.map(id => ({
          carton_id: id,
          to_location: warehouseLocation,
          movement_type: 'Transfer'
      }));
      const { error: whError } = await (supabase as any)
        .from('warehouse_movements')
        .insert(movements);
        
      if (whError) throw whError;

      // 3. Update local state
      set(state => ({
        cartons: state.cartons.map(c => cartonIds.includes(c.id) ? { ...c, status: 'In_Warehouse' } : c)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  }
}));
