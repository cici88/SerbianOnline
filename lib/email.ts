export const sendEmailNotification = async (to: string, subject: string, html: string) => {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });
    const data = await res.json();
    if (!data.success) {
      console.error("Failed to send email:", data.error);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
