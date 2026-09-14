export interface SpeakingTeil3ArchiveCard {
  id: string;
  imageIndex: number;
  alt: string;
  sampleRequest: string;
  sampleReaction: string;
}

const rawCards = [
  ['das Wasser', 'Geben Sie mir bitte ein Glas Wasser.', 'Ja, natürlich. Hier bitte.'],
  ['der Kaffee', 'Bringen Sie mir bitte einen Kaffee.', 'Ja, gern.'],
  ['der Tee', 'Bringen Sie mir bitte einen Tee.', 'Ja, gern.'],
  ['das Brot', 'Geben Sie mir bitte das Brot.', 'Ja, natürlich. Hier bitte.'],
  ['das Salz', 'Geben Sie mir bitte das Salz.', 'Ja, natürlich. Hier bitte.'],
  ['der Zucker', 'Geben Sie mir bitte den Zucker.', 'Ja, natürlich. Hier bitte.'],
  ['die Milch', 'Geben Sie mir bitte die Milch.', 'Ja, natürlich. Hier bitte.'],
  ['der Apfel', 'Geben Sie mir bitte einen Apfel.', 'Ja, gern. Hier bitte.'],
  ['die Banane', 'Geben Sie mir bitte eine Banane.', 'Ja, gern. Hier bitte.'],
  ['der Kuchen', 'Geben Sie mir bitte ein Stück Kuchen.', 'Ja, natürlich. Hier bitte.'],
  ['der Stift', 'Geben Sie mir bitte den Stift.', 'Ja, natürlich. Hier bitte.'],
  ['der Bleistift', 'Geben Sie mir bitte den Bleistift.', 'Ja, gern. Hier bitte.'],
  ['das Papier', 'Geben Sie mir bitte ein Blatt Papier.', 'Ja, gern. Hier bitte.'],
  ['das Buch', 'Geben Sie mir bitte das Buch.', 'Ja, natürlich. Hier bitte.'],
  ['die Zeitung', 'Geben Sie mir bitte die Zeitung.', 'Ja, gern. Hier bitte.'],
  ['das Handy', 'Geben Sie mir bitte das Handy.', 'Ja, natürlich. Hier bitte.'],
  ['das Telefon', 'Geben Sie mir bitte das Telefon.', 'Ja, gern. Hier bitte.'],
  ['der Computer', 'Zeigen Sie mir bitte den Computer.', 'Ja, gern.'],
  ['das Ladegerät', 'Geben Sie mir bitte das Ladegerät.', 'Ja, natürlich. Hier bitte.'],
  ['die Schere', 'Geben Sie mir bitte die Schere.', 'Ja, gern. Hier bitte.'],
  ['das Fenster', 'Öffnen Sie bitte das Fenster.', 'Ja, gern.'],
  ['die Tür', 'Öffnen Sie bitte die Tür.', 'Ja, natürlich.'],
  ['das Fenster', 'Schließen Sie bitte das Fenster.', 'Ja, gern.'],
  ['die Tür', 'Schließen Sie bitte die Tür.', 'Ja, natürlich.'],
  ['das Licht', 'Machen Sie bitte das Licht an.', 'Ja, gern.'],
  ['das Licht', 'Machen Sie bitte das Licht aus.', 'Ja, natürlich.'],
  ['das Radio', 'Machen Sie bitte das Radio an.', 'Ja, gern.'],
  ['die Musik', 'Machen Sie bitte die Musik leiser.', 'Ja, natürlich.'],
  ['der Fernseher', 'Machen Sie bitte den Fernseher an.', 'Ja, gern.'],
  ['die Heizung', 'Machen Sie bitte die Heizung an.', 'Ja, natürlich.'],
  ['die Tasche', 'Geben Sie mir bitte die Tasche.', 'Ja, gern. Hier bitte.'],
  ['der Koffer', 'Helfen Sie mir bitte mit dem Koffer.', 'Ja, gern.'],
  ['die Kamera', 'Geben Sie mir bitte die Kamera.', 'Ja, natürlich. Hier bitte.'],
  ['das Taxi', 'Rufen Sie mir bitte ein Taxi.', 'Ja, gern.'],
  ['die Fahrkarte', 'Geben Sie mir bitte eine Fahrkarte.', 'Ja, natürlich. Hier bitte.'],
  ['der Stadtplan', 'Geben Sie mir bitte den Stadtplan.', 'Ja, gern. Hier bitte.'],
  ['die Adresse', 'Schreiben Sie mir bitte die Adresse auf.', 'Ja, gern.'],
  ['die Uhr', 'Sagen Sie mir bitte die Uhrzeit.', 'Ja, natürlich.'],
  ['der Bahnhof', 'Zeigen Sie mir bitte den Weg zum Bahnhof.', 'Ja, gern.'],
  ['das Hotel', 'Zeigen Sie mir bitte den Weg zum Hotel.', 'Ja, gern.'],
  ['die Jacke', 'Geben Sie mir bitte die Jacke.', 'Ja, natürlich. Hier bitte.'],
  ['der Regenschirm', 'Geben Sie mir bitte den Regenschirm.', 'Ja, gern. Hier bitte.'],
  ['die Brille', 'Geben Sie mir bitte die Brille.', 'Ja, natürlich. Hier bitte.'],
  ['der Schlüssel', 'Geben Sie mir bitte den Schlüssel.', 'Ja, hier bitte.'],
  ['das Geld', 'Können Sie mir bitte Geld wechseln?', 'Ja, natürlich.'],
  ['die Speisekarte', 'Bringen Sie mir bitte die Speisekarte.', 'Ja, sofort.'],
  ['die Rechnung', 'Bringen Sie mir bitte die Rechnung.', 'Ja, sofort.'],
  ['das Glas', 'Geben Sie mir bitte ein Glas.', 'Ja, gern. Hier bitte.'],
  ['der Teller', 'Geben Sie mir bitte den Teller.', 'Ja, natürlich. Hier bitte.'],
  ['die Serviette', 'Geben Sie mir bitte eine Serviette.', 'Ja, gern. Hier bitte.'],
] as const;

export const speakingTeil3ArchiveCards: SpeakingTeil3ArchiveCard[] = rawCards.map(
  ([alt, sampleRequest, sampleReaction], imageIndex) => ({
    id: `sprechen-t3-${String(imageIndex + 1).padStart(2, '0')}`,
    imageIndex,
    alt,
    sampleRequest,
    sampleReaction,
  }),
);
