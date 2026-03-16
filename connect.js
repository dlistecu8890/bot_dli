const { connectDB } = require('./_utils/db');
const { createSession } = require('./_utils/wa');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectDB();

  const { phoneNumber } = req.body;
  if (!phoneNumber || phoneNumber.length < 10) {
    return res.status(400).json({ error: 'Nomor tidak valid' });
  }

  const formattedNumber = phoneNumber.startsWith('62') ? phoneNumber : `62${phoneNumber}`;

  try {
    let responseSent = false;

    const session = await createSession(
      formattedNumber,
      (code) => {
        if (!responseSent) {
          responseSent = true;
          res.status(200).json({
            success: true,
            pairingCode: code,
            phoneNumber: formattedNumber,
            message: 'Masukkan kode ke WhatsApp > Perangkat Tertaut'
          });
        }
      },
      () => {
        console.log(`Bot ${formattedNumber} connected`);
      }
    );

    // Timeout 60 detik
    setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        res.status(408).json({ 
          error: 'Timeout',
          message: 'Tidak dapat generate pairing code'
        });
      }
    }, 60000);

  } catch (error) {
    console.error('Connect error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};
