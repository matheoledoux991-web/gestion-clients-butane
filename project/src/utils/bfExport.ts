import jsPDF from 'jspdf';
import { Client, Order } from '../types';

const CATEGORY_NAMES: { [key: string]: string } = {
  papier_thermo: 'Papier Thermo',
  papier_paraffine: 'Papier Paraffiné',
  pots: 'Pots',
  bretelles: 'Bretelles',
  cabas_kraft_pp: 'Cabas Kraft PP',
  cabas_kraft_pt: 'Cabas Kraft PT',
  reutilisable: 'Réutilisable',
  isotherme: 'Isotherme',
  objet_pub: 'Objet Pub'
};

export async function exportOrderToBF(client: Client, order: Order) {
  try {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Format paysage
    
    // Marges et dimensions
    const pageWidth = 297; // A4 paysage
    const pageHeight = 210;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Configuration de la police
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    // === SECTION 1: EN-TÊTE AVEC INFORMATIONS CLIENT ===
    let currentY = margin;
    
    // Première ligne: ENTREPRISE | NOM | PRENOM | TEL FIXE/PORTABLE | DATE
    const row1Height = 12;
    const col1Width = 60;
    const col2Width = 50;
    const col3Width = 50;
    const col4Width = 80;
    const col5Width = 60; // Augmenté pour la date
    
    // Dessiner les cellules de la première ligne
    pdf.rect(margin, currentY, col1Width, row1Height);
    pdf.rect(margin + col1Width, currentY, col2Width, row1Height);
    pdf.rect(margin + col1Width + col2Width, currentY, col3Width, row1Height);
    pdf.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, row1Height);
    pdf.rect(margin + col1Width + col2Width + col3Width + col4Width, currentY, col5Width, row1Height);
    
    // Textes des en-têtes
    pdf.setFont('helvetica', 'bold');
    pdf.text('ENTREPRISE', margin + 2, currentY + 8);
    pdf.text('NOM', margin + col1Width + 2, currentY + 8);
    pdf.text('PRENOM', margin + col1Width + col2Width + 2, currentY + 8);
    pdf.text('TEL FIXE / PORTABLE', margin + col1Width + col2Width + col3Width + 2, currentY + 8);
    pdf.text('DATE :', margin + col1Width + col2Width + col3Width + col4Width + 2, currentY + 8);
    
    currentY += row1Height;
    
    // Deuxième ligne: Valeurs
    pdf.rect(margin, currentY, col1Width, row1Height);
    pdf.rect(margin + col1Width, currentY, col2Width, row1Height);
    pdf.rect(margin + col1Width + col2Width, currentY, col3Width, row1Height);
    pdf.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, row1Height);
    pdf.rect(margin + col1Width + col2Width + col3Width + col4Width, currentY, col5Width, row1Height);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(client.nomEntreprise || client.nom, margin + 2, currentY + 8);
    pdf.text(client.nom || '', margin + col1Width + 2, currentY + 8); // NOM
    pdf.text(client.prenom || '', margin + col1Width + col2Width + 2, currentY + 8); // PRENOM
    pdf.text(client.telephone || '', margin + col1Width + col2Width + col3Width + 2, currentY + 8);
    const dateText = order.dayOfWeek ? `${order.dayOfWeek} ${new Date().toLocaleDateString('fr-FR')}` : new Date().toLocaleDateString('fr-FR');
    pdf.text(dateText, margin + col1Width + col2Width + col3Width + col4Width + 2, currentY + 8);
    
    currentY += row1Height + 5;
    
    // === SECTION 2: ADRESSE DE LIVRAISON ===
    const addrRow1Height = 12;
    const addrCol1Width = 150;
    const addrCol2Width = 50;
    const addrCol3Width = contentWidth - addrCol1Width - addrCol2Width;
    
    // En-têtes adresse
    pdf.rect(margin, currentY, addrCol1Width, addrRow1Height);
    pdf.rect(margin + addrCol1Width, currentY, addrCol2Width, addrRow1Height);
    pdf.rect(margin + addrCol1Width + addrCol2Width, currentY, addrCol3Width, addrRow1Height);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('ADRESSE DE LIVRAISON', margin + 2, currentY + 8);
    pdf.text('CODE POSTAL', margin + addrCol1Width + 2, currentY + 8);
    pdf.text('VILLE', margin + addrCol1Width + addrCol2Width + 2, currentY + 8);
    
    currentY += addrRow1Height;
    
    // Valeurs adresse
    pdf.rect(margin, currentY, addrCol1Width, addrRow1Height);
    pdf.rect(margin + addrCol1Width, currentY, addrCol2Width, addrRow1Height);
    pdf.rect(margin + addrCol1Width + addrCol2Width, currentY, addrCol3Width, addrRow1Height);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(client.rue || '', margin + 2, currentY + 8);
    pdf.text(client.codePostal || '', margin + addrCol1Width + 2, currentY + 8);
    pdf.text(client.ville || '', margin + addrCol1Width + addrCol2Width + 2, currentY + 8);
    
    currentY += addrRow1Height + 5;
    
    // === SECTION 3: INSTRUCTIONS DE LIVRAISON ===
    const instrHeight = 15;
    pdf.rect(margin, currentY, contentWidth, instrHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INSTRUCTIONS DE LIVRAISON :', margin + 2, currentY + 8);
    
    // Ajouter les instructions si elles existent
    if (order.deliveryInstructions) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const maxWidth = contentWidth - 4;
      const lines = pdf.splitTextToSize(order.deliveryInstructions, maxWidth);
      let textY = currentY + 8;
      lines.forEach((line: string, index: number) => {
        if (index < 2) { // Limiter à 2 lignes pour éviter le débordement
          pdf.text(line, margin + 150, textY + (index * 4));
        }
      });
      pdf.setFontSize(10); // Remettre la taille par défaut
    }
    
    currentY += instrHeight + 10;
    
    // === SECTION 4: LOGO ET INFORMATIONS FOURNISSEUR ===
    const logoSectionHeight = 35; // Réduit de 50 à 35
    
    // Logo (rectangle simulé)
    const logoWidth = 60;
    const logoHeight = 30; // Réduit de 40 à 30
    pdf.rect(margin, currentY, logoWidth, logoHeight);
    
    // Simuler le logo COMECO
    pdf.setFontSize(12); // Réduit de 14 à 12
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMECO', margin + 15, currentY + 15); // Ajusté
    pdf.setFontSize(9); // Réduit de 10 à 9
    pdf.text('Emballages', margin + 18, currentY + 23); // Ajusté
    
    // Informations fournisseur (centre)
    const infoStartX = margin + logoWidth + 20;
    pdf.setFontSize(12); // Réduit de 14 à 12
    pdf.setFont('helvetica', 'bold');
    pdf.text('BON DE COMMANDE FOURNISSEUR', infoStartX, currentY + 8); // Ajusté
    pdf.text('COMECO EMBALLAGES', infoStartX, currentY + 16); // Ajusté
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9); // Réduit de 10 à 9
    pdf.text('29 rue de la noë des puits 44119 Treillières', infoStartX, currentY + 22); // Ajusté
    pdf.text('comeco.emballages@gmail.com 0613014913', infoStartX, currentY + 28); // Ajusté
    pdf.text(`commande n° ${order.orderNumber || 'N/A'}`, infoStartX, currentY + 34); // Ajusté
    
    // Calendrier de livraison (droite)
    // Informations de livraison
    const deliveryInfo = [];
    if (order.deliveryWeek && order.deliveryYear) {
      deliveryInfo.push(`Semaine ${order.deliveryWeek}, ${order.deliveryYear}`);
    }
    if (order.dayOfWeek) {
      deliveryInfo.push(order.dayOfWeek);
    }
    
    const calendarStartX = pageWidth - margin - 80;
    const calendarWidth = 100; // Augmenté pour plus d'espace
    const calendarHeight = 35; // Réduit de 50 à 35
    
    pdf.rect(calendarStartX, currentY, calendarWidth, calendarHeight);
    
    // Section gauche avec informations de livraison
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9); // Réduit de 10 à 9
    pdf.text('LIVRAISON', calendarStartX + 3, currentY + 6); // Ajusté
    
    // Afficher les informations de livraison
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    if (deliveryInfo.length > 0) {
      deliveryInfo.forEach((info, index) => {
        pdf.text(info, calendarStartX + 3, currentY + 12 + (index * 6)); // Ajusté
      });
    } else {
      pdf.text('Non spécifiée', calendarStartX + 3, currentY + 12);
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Jour de fermeture', calendarStartX + 3, currentY + 26); // Ajusté
    
    // Afficher les jours de fermeture s'ils existent
    if (order.closureDays && order.closureDays.length > 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      const closureDaysText = order.closureDays.join(', ');
      // Diviser le texte si trop long
      if (closureDaysText.length > 20) {
        const firstLine = order.closureDays.slice(0, 2).join(', ');
        const secondLine = order.closureDays.slice(2).join(', ');
        pdf.text(firstLine, calendarStartX + 3, currentY + 32);
        if (secondLine) {
          pdf.text(secondLine, calendarStartX + 3, currentY + 37);
        }
      } else {
        pdf.text(closureDaysText, calendarStartX + 3, currentY + 32);
      }
    }
    
    // Grille calendrier à droite
    
    currentY += logoSectionHeight + 5; // Réduit l'espacement de 10 à 5
    
    // === SECTION 5: TABLEAU DES PRODUITS ===
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    // Définir les colonnes du tableau
    const tableStartY = currentY;
    const rowHeight = 12; // Réduit de 15 à 12
    const tableWidth = 245; // Largeur totale du tableau
    const tableStartX = (pageWidth - tableWidth) / 2; // Centrer le tableau
    const colWidths = [22, 32, 22, 18, 42, 28, 28, 28, 25]; // Colonnes réduites
    const headers = ['Code', 'Famille', 'Matière', 'ep gr', 'Format', 'Recto NB', 'Verso NB', 'Soufflet NB', 'Quantité'];
    
    // Dessiner les en-têtes
    let currentX = tableStartX;
    for (let i = 0; i < headers.length; i++) {
      pdf.rect(currentX, currentY, colWidths[i], rowHeight);
      pdf.text(headers[i], currentX + 2, currentY + 8); // Ajusté pour la nouvelle hauteur
      currentX += colWidths[i];
    }
    
    currentY += rowHeight;
    
    // Dessiner les lignes de produits
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8); // Réduit la taille de police pour les données
    
    if (order.products && order.products.length > 0) {
      order.products.forEach((product, index) => {
        if (index < 8) { // Limiter à 8 lignes
          currentX = tableStartX;
          
          // Dessiner les cellules
          for (let i = 0; i < colWidths.length; i++) {
            pdf.rect(currentX, currentY, colWidths[i], rowHeight);
            currentX += colWidths[i];
          }
          
          // Remplir les données
          currentX = tableStartX;
          pdf.text('', currentX + 2, currentY + 8); // Code (vide) - ajusté
          currentX += colWidths[0];
          
          // Famille : pour les pots, afficher "Pots" + couleur du pot
          let familleText = '';
          if (product.category === 'pots') {
            familleText = `Pots ${product.color || ''}`.trim();
          } else {
            const categoryName = CATEGORY_NAMES[product.category] || product.category;
            familleText = categoryName;
          }
          pdf.text(familleText, currentX + 2, currentY + 8); // Famille - ajusté
          currentX += colWidths[1];
          
          // Matière : "AI" pour tout sauf les pots qui ont "Couv"
          const matiereText = product.category === 'pots' 
            ? `Couv AT ${(product as any).couvAT || ''}`.trim()
            : 'AI';
          pdf.text(matiereText, currentX + 2, currentY + 8); // Matière - ajusté
          currentX += colWidths[2];
          
          // ep gr : grammage pour papier, vide pour pots
          let grammage = '';
          if (product.category === 'papier_thermo') {
            grammage = '60gr';
          } else if (product.category === 'papier_paraffine') {
            grammage = '52gr';
          }
          // Pour les pots, ep gr reste vide
          pdf.text(grammage, currentX + 2, currentY + 8); // ep gr - ajusté
          currentX += colWidths[3];
          
          // Tronquer le nom du produit s'il est trop long pour la cellule
          const maxFormatLength = 10; // Réduit de 12 à 10
          const formatText = product.name.length > maxFormatLength 
            ? product.name.substring(0, maxFormatLength - 2) + '..'
            : product.name;
          pdf.text(formatText, currentX + 2, currentY + 8); // Format - ajusté
          currentX += colWidths[4];
          
          // Recto NB : couleur impression pour les pots, couleurs normales pour le papier
          if (product.category === 'pots') {
            // Pour les pots, afficher la couleur d'impression
            const impressionColors = (product as any).impressionColors || [];
            if (impressionColors.length > 0) {
              // Afficher les couleurs d'impression sur plusieurs lignes, centrées verticalement
              const totalColors = Math.min(impressionColors.length, 3);
              const lineHeight = 4; // 4mm entre chaque ligne
              const totalTextHeight = (totalColors - 1) * lineHeight;
              const startY = currentY + (rowHeight - totalTextHeight) / 2;
              
              impressionColors.forEach((color: string, colorIndex: number) => {
                const yOffset = startY + (colorIndex * lineHeight);
                if (colorIndex < 3) { // Limiter à 3 couleurs pour éviter le débordement
                  // Centrer le texte dans la cellule
                  const textWidth = pdf.getTextWidth(color);
                  const cellWidth = colWidths[5];
                  const xCentered = currentX + (cellWidth - textWidth) / 2;
                  pdf.text(color, xCentered, yOffset);
                }
              });
            } else {
              // Fallback pour l'ancien format impressionColor (singulier)
              const impressionColor = (product as any).impressionColor || '';
              if (impressionColor) {
                const textWidth = pdf.getTextWidth(impressionColor);
                const cellWidth = colWidths[5];
                const xCentered = currentX + (cellWidth - textWidth) / 2;
                const yCentered = currentY + rowHeight / 2;
                pdf.text(impressionColor, xCentered, yCentered);
              }
            }
          } else {
            // Pour le papier, afficher les couleurs comme avant
            if (product.colors && product.colors.length > 0) {
              // Afficher les couleurs sur plusieurs lignes, centrées verticalement
              const totalColors = Math.min(product.colors.length, 3);
              const lineHeight = 4; // 4mm entre chaque ligne
              const totalTextHeight = (totalColors - 1) * lineHeight;
              const startY = currentY + (rowHeight - totalTextHeight) / 2;
              
              product.colors.forEach((color, colorIndex) => {
                const yOffset = startY + (colorIndex * lineHeight);
                if (colorIndex < 3) { // Limiter à 3 couleurs pour éviter le débordement
                  // Centrer le texte dans la cellule
                  const textWidth = pdf.getTextWidth(color);
                  const cellWidth = colWidths[5];
                  const xCentered = currentX + (cellWidth - textWidth) / 2;
                  pdf.text(color, xCentered, yOffset);
                }
              });
            } else if (product.color) {
              // Compatibilité avec l'ancien format
              // Centrer le texte dans la cellule
              const textWidth = pdf.getTextWidth(product.color);
              const cellWidth = colWidths[5];
              const xCentered = currentX + (cellWidth - textWidth) / 2;
              const yCentered = currentY + rowHeight / 2;
              pdf.text(product.color, xCentered, yCentered);
            }
          }
          currentX += colWidths[5];
          
          pdf.text('', currentX + 2, currentY + 8); // Verso NB (vide) - ajusté
          currentX += colWidths[6];
          
          pdf.text('', currentX + 2, currentY + 8); // Soufflet NB (vide) - ajusté
          currentX += colWidths[7];
          
          // Afficher la quantité avec l'unité appropriée
          let quantityText = '';
          if (product.category === 'papier_thermo' || product.category === 'papier_paraffine') {
            quantityText = `${product.quantity} kg`;
          } else {
            quantityText = `${product.quantity} unité${product.quantity > 1 ? 's' : ''}`;
          }
          pdf.text(quantityText, currentX + 2, currentY + 8); // Quantité - ajusté
          
          currentY += rowHeight;
        }
      });
    }
    
    // Ajouter des lignes vides pour compléter le tableau (8 lignes au total)
    const totalRows = 10; // Augmenté de 8 à 10 pour plus de lignes
    const filledRows = order.products ? Math.min(order.products.length, 8) : 0;
    
    for (let i = filledRows; i < totalRows; i++) {
      currentX = tableStartX;
      for (let j = 0; j < colWidths.length; j++) {
        pdf.rect(currentX, currentY, colWidths[j], rowHeight);
        currentX += colWidths[j];
      }
      currentY += rowHeight;
    }
    
    // Télécharger le PDF
    const fileName = `BF-${client.nom.replace(/[^a-zA-Z0-9]/g, '-')}-S${order.weekNumber}-${order.year}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la génération du BF:', error);
    throw error;
  }
}