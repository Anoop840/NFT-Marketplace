const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      console.log("Email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Send email error:", error);
      throw error;
    }
  }

  async sendWelcomeEmail(email, username) {
    const subject = "Welcome to NFT Marketplace";
    const html = `
      <h1>Welcome ${username}!</h1>
      <p>Thank you for joining our NFT Marketplace.</p>
      <p>Start exploring and creating amazing NFTs!</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendNFTSoldNotification(email, nftName, price) {
    const subject = "Your NFT has been sold!";
    const html = `
      <h1>Congratulations!</h1>
      <p>Your NFT "${nftName}" has been sold for ${price} ETH.</p>
      <p>Check your wallet for the payment.</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendNFTPurchaseConfirmation(email, nftName, price) {
    const subject = "NFT Purchase Confirmation";
    const html = `
      <h1>Purchase Successful!</h1>
      <p>You have successfully purchased "${nftName}" for ${price} ETH.</p>
      <p>The NFT has been transferred to your wallet.</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendBidNotification(email, nftName, bidAmount) {
    const subject = "New Bid on Your NFT";
    const html = `
      <h1>New Bid Received!</h1>
      <p>Someone placed a bid of ${bidAmount} ETH on your NFT "${nftName}".</p>
      <p>View your auction details on the marketplace.</p>
    `;

    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
