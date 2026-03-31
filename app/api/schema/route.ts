import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Try to add video_link to bookings
    const { error: err1 } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'bookings',
      column_name: 'video_link',
      column_type: 'text'
    });
    
    // Try to add notes to student_profiles
    const { error: err2 } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'student_profiles',
      column_name: 'notes',
      column_type: 'text'
    });

    return NextResponse.json({ success: true, err1, err2 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
