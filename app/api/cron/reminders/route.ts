import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmailNotification } from '@/lib/email';

export async function GET(request: Request) {
  // In a real app, you should secure this endpoint with a secret key
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const now = new Date();
    const oneHourThirtyMinsFromNow = new Date(now.getTime() + 90 * 60000);
    const oneHourFortyFiveMinsFromNow = new Date(now.getTime() + 105 * 60000);

    // Find bookings that start between 1h 30m and 1h 45m from now
    const { data: upcomingBookings, error } = await supabase
      .from('bookings')
      .select('*, student_profiles(full_name)')
      .eq('status', 'scheduled')
      .is('reminder_sent', false)
      .gte('starts_at', oneHourThirtyMinsFromNow.toISOString())
      .lt('starts_at', oneHourFortyFiveMinsFromNow.toISOString());

    if (error) throw error;

    let emailsSent = 0;

    for (const booking of upcomingBookings || []) {
      if (booking.student_email) {
        const timeStr = new Date(booking.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        await sendEmailNotification(
          booking.student_email,
          "Podsetnik: Vaš čas počinje uskoro!",
          `<h1>Podsetnik za čas</h1>
           <p>Zdravo ${booking.student_profiles?.full_name || 'Student'},</p>
           <p>Vaš čas počinje za sat i po vremena (u ${timeStr}).</p>
           ${booking.video_link ? `<p>Link za video poziv: <a href="${booking.video_link}">${booking.video_link}</a></p>` : ''}
           <p>Vidimo se uskoro!</p>`
        );
        
        // Mark as sent
        await supabase.from('bookings').update({ reminder_sent: true }).eq('id', booking.id);
        
        emailsSent++;
      }
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error: any) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
