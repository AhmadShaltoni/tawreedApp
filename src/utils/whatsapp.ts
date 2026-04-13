import { Linking } from "react-native";

/**
 * Opens WhatsApp with a predefined message
 * @param message - The message to send (optional)
 */
export const openWhatsApp = async (message: string = "مرحبا") => {
  const phoneNumber = "962798336958"; // Remove leading 00 and replace with country code
  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  try {
    const supported = await Linking.canOpenURL(whatsappURL);
    if (supported) {
      await Linking.openURL(whatsappURL);
    } else {
      // Fallback: open web.whatsapp.com
      await Linking.openURL(
        `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`,
      );
    }
  } catch (error) {
    console.error("Error opening WhatsApp:", error);
  }
};
