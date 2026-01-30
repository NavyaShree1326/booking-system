{/*}
/// <reference lib="deno.ns" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled'
  booking: {
    id: string
    title: string
    description?: string
    start_time: string
    end_time: string
    location?: string
    meeting_link?: string
  }
  attendees: {
    email: string
    full_name: string
  }[]
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Booking System <onboarding@resend.dev>'

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Using RESEND_FROM:', RESEND_FROM)

    const { type, booking, attendees }: EmailRequest = await req.json()

    console.log(`Processing ${type} for booking: ${booking.id}`)
    console.log(`Sending to ${attendees.length} attendees`)

    const emailResults = []

    for (const attendee of attendees) {
      try {
        const subject = getSubject(type, booking.title)
        const html = getHTML(type, booking, attendee)
        const ics = generateICS(booking, attendee)

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: attendee.email,
            subject: subject,
            html: html,
            attachments: [{
              filename: 'invite.ics',
              content: btoa(ics)
            }]
          }),
        })

        let data: unknown = null
        try {
          data = await response.json()
        } catch (_e) {
          try { data = await response.text() } catch { data = null }
        }

        if (!response.ok) {
          console.error(`Failed to send to ${attendee.email}: status=${response.status}`, data)
          emailResults.push({
            email: attendee.email,
            success: false,
            status: response.status,
            error: data
          })
        } else {
          console.log(`✓ Sent to ${attendee.email}`)
          emailResults.push({ email: attendee.email, success: true, status: response.status })
        }
      } catch (error) {
        console.error(`Error sending to ${attendee.email}:`, error)
        emailResults.push({ email: attendee.email, success: false, error: String(error) })
      }
    }

    const successCount = emailResults.filter(r => r.success).length

    const allOk = successCount === attendees.length
    const status = allOk ? 200 : 502

    return new Response(
      JSON.stringify({
        success: allOk,
        message: `${successCount}/${attendees.length} emails sent`,
        results: emailResults
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getSubject(type: string, title: string): string {
  const prefixes = {
    booking_created: '📅 Invitation',
    booking_updated: '🔄 Updated',
    booking_cancelled: '❌ Cancelled'
  }
  return `${prefixes[type as keyof typeof prefixes] || ''}: ${title}`
}

function getHTML(type: string, booking: EmailRequest['booking'], attendee: EmailRequest['attendees'][number]): string {
  const formatDate = (dateString: string) => {
    // Create date object
    const date = new Date(dateString)
    
    // Format with Asia/Kolkata timezone
    return date.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
  }

  const start = formatDate(booking.start_time)
  const end = formatDate(booking.end_time)

  const headers = {
    booking_created: '📅 You\'re Invited to a Meeting',
    booking_updated: '🔄 Meeting Details Updated',
    booking_cancelled: '❌ Meeting Cancelled'
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:white;">
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 20px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;font-weight:600;">${headers[type as keyof typeof headers]}</h1>
    </div>
    <div style="padding:40px 30px;">
      <p style="font-size:16px;color:#333;margin:0 0 20px;">Hi <strong>${attendee.full_name}</strong>,</p>
      <div style="background:#f8f9fa;border-left:4px solid #667eea;padding:20px;margin:20px 0;border-radius:4px;">
        <h2 style="margin:0 0 15px;color:#667eea;font-size:22px;">${booking.title}</h2>
        ${booking.description ? `<p style="color:#666;margin:0 0 15px;line-height:1.6;">${booking.description}</p>` : ''}
        <div style="margin:10px 0;">
          <p style="margin:5px 0;color:#333;"><strong>📅 Start:</strong> ${start}</p>
          <p style="margin:5px 0;color:#333;"><strong>⏰ End:</strong> ${end}</p>
          ${booking.location ? `<p style="margin:5px 0;color:#333;"><strong>📍 Location:</strong> ${booking.location}</p>` : ''}
          ${booking.meeting_link ? `<p style="margin:5px 0;color:#333;"><strong>🔗 Join:</strong> <a href="${booking.meeting_link}" style="color:#667eea;text-decoration:none;">${booking.meeting_link}</a></p>` : ''}
        </div>
      </div>
      ${booking.meeting_link && type !== 'booking_cancelled' ? `
      <div style="text-align:center;margin:30px 0;">
        <a href="${booking.meeting_link}" style="display:inline-block;background:#667eea;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Join Meeting</a>
      </div>
      ` : ''}
      <div style="background:#e3f2fd;border-radius:6px;padding:16px;margin:20px 0;">
        <p style="margin:0;color:#1565c0;font-weight:500;">📎 <strong>Calendar Invite Attached</strong></p>
        <p style="margin:8px 0 0;color:#1976d2;font-size:14px;">Click the attached .ics file to add this event to your calendar</p>
      </div>
    </div>
    <div style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #e0e0e0;">
      <p style="margin:0;color:#666;font-size:13px;">Booking System - Automated Email</p>
      <p style="margin:5px 0 0;color:#999;font-size:12px;">Please do not reply to this email</p>
    </div>
  </div>
</body>
</html>`
}

function generateICS(booking: EmailRequest['booking'], attendee: EmailRequest['attendees'][number]): string {
  const formatICSDate = (dateString: string): string => {
    return new Date(dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const formatLocalICSDate = (dateString: string): string => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}T${hours}${minutes}${seconds}`
  }

  const escapeICS = (text: string): string => {
    return (text || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booking System//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VTIMEZONE
TZID:Asia/Kolkata
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0530
TZOFFSETTO:+0530
TZNAME:IST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${booking.id}@bookingsystem.com
DTSTAMP:${formatICSDate(new Date().toISOString())}
DTSTART;TZID=Asia/Kolkata:${formatLocalICSDate(booking.start_time)}
DTEND;TZID=Asia/Kolkata:${formatLocalICSDate(booking.end_time)}
SUMMARY:${escapeICS(booking.title)}
DESCRIPTION:${escapeICS(booking.description || 'No description')}
LOCATION:${escapeICS(booking.location || 'TBA')}
ORGANIZER;CN=Booking System:mailto:bookings@yourdomain.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeICS(attendee.full_name)}:mailto:${attendee.email}
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
CLASS:PUBLIC
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapeICS(booking.title)}
END:VALARM
END:VEVENT
END:VCALENDAR`
}
*/}

/// <reference lib="deno.ns" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled'
  booking: {
    id: string
    title: string
    description?: string
    start_time: string
    end_time: string
    location?: string
    meeting_link?: string
  }
  attendees: {
    email: string
    full_name: string
  }[]
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Booking System <onboarding@resend.dev>'

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Using RESEND_FROM:', RESEND_FROM)

    const { type, booking, attendees }: EmailRequest = await req.json()

    console.log(`Processing ${type} for booking: ${booking.id}`)
    console.log(`Sending to ${attendees.length} attendees`)

    const emailResults = []

    for (const attendee of attendees) {
      try {
        const subject = getSubject(type, booking.title)
        const html = getHTML(type, booking, attendee)
        const ics = generateICS(booking, attendee)

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: attendee.email,
            subject: subject,
            html: html,
            attachments: [{
              filename: 'invite.ics',
              content: btoa(ics)
            }]
          }),
        })

        let data: unknown = null
        try {
          data = await response.json()
        } catch (_e) {
          try { data = await response.text() } catch { data = null }
        }

        if (!response.ok) {
          console.error(`Failed to send to ${attendee.email}: status=${response.status}`, data)
          emailResults.push({
            email: attendee.email,
            success: false,
            status: response.status,
            error: data
          })
        } else {
          console.log(`✓ Sent to ${attendee.email}`)
          emailResults.push({ email: attendee.email, success: true, status: response.status })
        }
      } catch (error) {
        console.error(`Error sending to ${attendee.email}:`, error)
        emailResults.push({ email: attendee.email, success: false, error: String(error) })
      }
    }

    const successCount = emailResults.filter(r => r.success).length

    const allOk = successCount === attendees.length
    const status = allOk ? 200 : 502

    return new Response(
      JSON.stringify({
        success: allOk,
        message: `${successCount}/${attendees.length} emails sent`,
        results: emailResults
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getSubject(type: string, title: string): string {
  const prefixes = {
    booking_created: '📅 Invitation',
    booking_updated: '🔄 Updated',
    booking_cancelled: '❌ Cancelled'
  }
  return `${prefixes[type as keyof typeof prefixes] || ''}: ${title}`
}

function getHTML(type: string, booking: EmailRequest['booking'], attendee: EmailRequest['attendees'][number]): string {
  const formatDate = (dateString: string) => {
    // Create date object
    const date = new Date(dateString)
    
    // Format with Asia/Kolkata timezone
    return date.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
  }

  const start = formatDate(booking.start_time)
  const end = formatDate(booking.end_time)

  const headers = {
    booking_created: '📅 You\'re Invited to a Meeting',
    booking_updated: '🔄 Meeting Details Updated',
    booking_cancelled: '❌ Meeting Cancelled'
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:white;">
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 20px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;font-weight:600;">${headers[type as keyof typeof headers]}</h1>
    </div>
    <div style="padding:40px 30px;">
      <p style="font-size:16px;color:#333;margin:0 0 20px;">Hi <strong>${attendee.full_name}</strong>,</p>
      <div style="background:#f8f9fa;border-left:4px solid #667eea;padding:20px;margin:20px 0;border-radius:4px;">
        <h2 style="margin:0 0 15px;color:#667eea;font-size:22px;">${booking.title}</h2>
        ${booking.description ? `<p style="color:#666;margin:0 0 15px;line-height:1.6;">${booking.description}</p>` : ''}
        <div style="margin:10px 0;">
          <p style="margin:5px 0;color:#333;"><strong>📅 Start:</strong> ${start}</p>
          <p style="margin:5px 0;color:#333;"><strong>⏰ End:</strong> ${end}</p>
          ${booking.location ? `<p style="margin:5px 0;color:#333;"><strong>📍 Location:</strong> ${booking.location}</p>` : ''}
          ${booking.meeting_link ? `<p style="margin:5px 0;color:#333;"><strong>🔗 Join:</strong> <a href="${booking.meeting_link}" style="color:#667eea;text-decoration:none;">${booking.meeting_link}</a></p>` : ''}
        </div>
      </div>
      ${booking.meeting_link && type !== 'booking_cancelled' ? `
      <div style="text-align:center;margin:30px 0;">
        <a href="${booking.meeting_link}" style="display:inline-block;background:#667eea;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Join Meeting</a>
      </div>
      ` : ''}
      <div style="background:#e3f2fd;border-radius:6px;padding:16px;margin:20px 0;">
        <p style="margin:0;color:#1565c0;font-weight:500;">📎 <strong>Calendar Invite Attached</strong></p>
        <p style="margin:8px 0 0;color:#1976d2;font-size:14px;">Click the attached .ics file to add this event to your calendar</p>
      </div>
    </div>
    <div style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #e0e0e0;">
      <p style="margin:0;color:#666;font-size:13px;">Booking System - Automated Email</p>
      <p style="margin:5px 0 0;color:#999;font-size:12px;">Please do not reply to this email</p>
    </div>
  </div>
</body>
</html>`
}

function generateICS(booking: EmailRequest['booking'], attendee: EmailRequest['attendees'][number]): string {
  const formatICSDate = (dateString: string): string => {
    return new Date(dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const escapeICS = (text: string): string => {
    return (text || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booking System//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${booking.id}@bookingsystem.com
DTSTAMP:${formatICSDate(new Date().toISOString())}
DTSTART:${formatICSDate(booking.start_time)}
DTEND:${formatICSDate(booking.end_time)}
SUMMARY:${escapeICS(booking.title)}
DESCRIPTION:${escapeICS(booking.description || 'No description')}
LOCATION:${escapeICS(booking.location || 'TBA')}
ORGANIZER;CN=Booking System:mailto:bookings@yourdomain.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeICS(attendee.full_name)}:mailto:${attendee.email}
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
CLASS:PUBLIC
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapeICS(booking.title)}
END:VALARM
END:VEVENT
END:VCALENDAR`
}