import 'dotenv/config';
import { createSupabaseBooking } from '../server/supabaseData';

async function run() {
  try {
    const sample = {
      serviceId: 2,
      date: new Date().toISOString().slice(0,10), // today
      startTime: '09:00',
      customerName: 'Test Client',
      phone: '+2250700000000',
      vehicle: 'Toyota RAV4',
      address: 'Rue des Jardins',
      neighborhood: 'Riviera',
      landmark: null,
    };
    const bookingNumber = `TEST-${Date.now().toString().slice(-6)}`;
    const row = await createSupabaseBooking(null, bookingNumber, sample as any);
    console.log('Booking created:', row);
  } catch (err:any) {
    console.error('Create booking failed:', err?.message ?? err);
    process.exit(1);
  }
}

run();
