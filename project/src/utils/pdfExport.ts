import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Client, Order } from '../types';
import { calculateClientStats, formatWeek, formatCurrency, getCurrentWeek, calculateProductPredictions } from './calculations';

export async function exportClientToPDF(client: Client, orders: Order[]) {
  try {
    const clientOrders = orders.filter(order => order.clientId === client.id);
    const stats = calculateClientStats(clientOrders);
    const productPredictions = calculateProductPredictions(clientOrders);
    const currentWeek = getCurrentWeek();

    // Calculer la consommation par produit
    const getUniqueProducts = () => {
      const products = new Set<string>();
      clientOrders.forEach(order => {
        if (order.products && order.products.length > 0) {
          order.products.forEach(product => {
            products.add(product.name);
          });
        }
      });
      return Array.from(products).sort();
    };

    const calculateProductConsumption = (productName: string) => {
      if (clientOrders.length < 2) {
        return { weeklyConsumption: 0, monthlyConsumption: 0 };
      }

      const chronologicalOrders = [...clientOrders].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.weekNumber - b.weekNumber;
      });
      
      const firstToSecondLast = chronologicalOrders.slice(0, -1);
      
      const totalProductQuantity = firstToSecondLast.reduce((sum, order) => {
        if (order.products && order.products.length > 0) {
          const product = order.products.find(p => p.name === productName);
          return sum + (product ? product.quantity : 0);
        }
        return sum;
      }, 0);
      
      const firstOrder = chronologicalOrders[0];
      const lastOrder = chronologicalOrders[chronologicalOrders.length - 1];
      
      const firstWeekOfYear = firstOrder.year * 52 + firstOrder.weekNumber;
      const lastWeekOfYear = lastOrder.year * 52 + lastOrder.weekNumber;
      const totalWeeksSpan = lastWeekOfYear - firstWeekOfYear;
      
      if (totalWeeksSpan > 0) {
        const weeklyConsumption = totalProductQuantity / totalWeeksSpan;
        const monthlyConsumption = weeklyConsumption * 4.33;
        return {
          weeklyConsumption: Math.round(weeklyConsumption * 100) / 100,
          monthlyConsumption: Math.round(monthlyConsumption * 100) / 100
        };
      }

      return { weeklyConsumption: 0, monthlyConsumption: 0 };
    };

    const uniqueProducts = getUniqueProducts();

    // Trier les commandes de la plus récente à la plus ancienne
    const sortedOrders = clientOrders.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });

    // Créer un élément temporaire pour le contenu PDF
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';

    // Contenu HTML pour le PDF
    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px;">
        <h1 style="color: #3B82F6; margin: 0; font-size: 28px;">PaperFlow</h1>
        <h2 style="color: #374151; margin: 10px 0 0 0; font-size: 20px;">Fiche Client</h2>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
          Informations Client
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 150px;">Nom:</td>
            <td style="padding: 8px 0;">${client.nomEntreprise || client.nom}</td>
          </tr>
          ${client.nom && client.prenom ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Contact:</td>
            <td style="padding: 8px 0;">${client.prenom} ${client.nom}</td>
          </tr>
          ` : ''}
          ${client.email ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
            <td style="padding: 8px 0;">${client.email}</td>
          </tr>` : ''}
          ${client.telephone ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Téléphone:</td>
            <td style="padding: 8px 0;">${client.telephone}</td>
          </tr>` : ''}
          ${client.rue || client.ville ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Adresse:</td>
            <td style="padding: 8px 0;">${
              client.rue && client.ville && client.codePostal 
                ? `${client.rue}, ${client.codePostal} ${client.ville}` 
                : client.rue && client.ville 
                  ? `${client.rue}, ${client.ville}`
                  : client.rue || (client.codePostal && client.ville ? `${client.codePostal} ${client.ville}` : client.ville)
            }</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Client depuis:</td>
            <td style="padding: 8px 0;">${new Date(client.createdAt).toLocaleDateString('fr-FR')}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
          Statistiques
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold; color: #374151;">Total Commandes</div>
            <div style="font-size: 24px; color: #3B82F6; font-weight: bold;">${stats.totalOrders}</div>
          </div>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold; color: #374151;">Consommation/mois</div>
            <div style="font-size: 24px; color: #10B981; font-weight: bold;">${formatCurrency(stats.monthlyConsumption)} kg</div>
          </div>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold; color: #374151;">Écart moyen (semaines)</div>
            <div style="font-size: 24px; color: #6366F1; font-weight: bold;">${stats.averageWeeksBetweenOrders}</div>
          </div>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold; color: #374151;">Consommation/semaine</div>
            <div style="font-size: 24px; color: #8B5CF6; font-weight: bold;">${formatCurrency(stats.weeklyConsumption)} kg</div>
          </div>
        </div>
      </div>

      ${uniqueProducts.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
          Consommation moyenne par produit
        </h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB;">
          <thead>
            <tr style="background: #F9FAFB;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: bold;">Produit</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: bold;">Conso moyenne/semaine</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: bold;">Conso moyenne/mois</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: bold;">Prochaine commande</th>
            </tr>
          </thead>
          <tbody>
            ${uniqueProducts.map((product, index) => {
              const consumption = calculateProductConsumption(product);
              const prediction = productPredictions.find(p => p.productName === product);
              
              // N'afficher que les produits qui ont une consommation calculée
              if (consumption.weeklyConsumption === 0) {
                return '';
              }
              
              return `
              <tr style="${index % 2 === 0 ? 'background: #FFFFFF;' : 'background: #F9FAFB;'}">
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: bold;">
                  ${product}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                  ${consumption.weeklyConsumption > 0 ? formatCurrency(consumption.weeklyConsumption) + ' unités' : 'Données insuffisantes'}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                  ${consumption.monthlyConsumption > 0 ? formatCurrency(consumption.monthlyConsumption) + ' unités' : 'Données insuffisantes'}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                  ${prediction ? formatWeek(prediction.nextOrderPrediction.week, prediction.nextOrderPrediction.year) : 'N/A'}
                </td>
              </tr>
              `;
            }).filter(row => row !== '').join('')}
          </tbody>
        </table>
        <div style="margin-top: 10px; padding: 10px; background: #F3F4F6; border-radius: 6px; font-size: 12px; color: #6B7280;">
          <strong>Note :</strong> La consommation moyenne est calculée sur la base des commandes passées (de la première à l'avant-dernière), 
          répartie sur la période totale. Seuls les produits avec des données suffisantes sont affichés.
        </div>
      </div>` : ''}

      <div style="margin-bottom: 30px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
          Historique des commandes (5 dernières)
        </h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB;">
          <thead>
            <tr style="background: #F9FAFB;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: bold;">Semaine</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: bold;">Livraison</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: bold;">Produits</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${clientOrders.slice(0, 5).map((order, index) => `
              <tr style="${index % 2 === 0 ? 'background: #FFFFFF;' : 'background: #F9FAFB;'}">
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                  ${formatWeek(order.weekNumber, order.year)}${order.dayOfWeek ? ` - ${order.dayOfWeek}` : ''}
                  ${order.closureDays && order.closureDays.length > 0 ? `<br><span style="color: #DC2626; font-size: 10px;">Fermé: ${order.closureDays.join(', ')}</span>` : ''}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                  ${order.deliveryWeek && order.deliveryYear 
                    ? `<span style="color: #10B981; font-weight: bold;">${formatWeek(order.deliveryWeek, order.deliveryYear)}</span>`
                    : '<span style="color: #9CA3AF;">Non spécifiée</span>'
                  }
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                  ${order.products && order.products.length > 0 
                    ? order.products.map(p => `${p.name}${p.color ? ` (${p.color})` : ''}: ${p.quantity} ${
                        (p.category === 'papier_thermo' || p.category === 'papier_paraffine') ? 'kg' : ''
                      }`).join('<br>')
                    : 'Détails non disponibles'
                  }
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: bold;">
                  ${order.total} ${order.products && order.products.length > 0 ? 'unités' : 'kg'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 40px; text-align: center; color: #6B7280; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
        <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        <p>PaperFlow - Système de gestion des commandes papier</p>
      </div>
    `;

    document.body.appendChild(tempDiv);

    // Générer le canvas à partir du HTML
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // Supprimer l'élément temporaire
    document.body.removeChild(tempDiv);

    // Créer le PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Ajouter la première page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Télécharger le PDF
    const fileName = `fiche-client-${client.nom.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw error;
  }
}