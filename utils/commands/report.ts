import { Resend } from 'resend';
import prisma from '@prisma/prisma';
import { Category, Expense } from '@prisma/client';

interface ReportData {
  expenses: (Expense & { category: Category })[];
  summary: {
    totalExpenses: number;
    byCategory: {
      category: string;
      total: number;
      count: number;
    }[];
  };
  dateRange: {
    from: Date;
    to: Date;
  };
};

export class ExpenseReporter {
  private resend: Resend;
  private recipientEmail: string;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    if (!process.env.RECIPIENT_EMAIL) {
      throw new Error('RECIPIENT_EMAIL environment variable is not set');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.recipientEmail = process.env.RECIPIENT_EMAIL;
  }

  private async generateReport(from: Date, to: Date): Promise<ReportData> {
    const expenses = await prisma.expense.findMany({
      where: {
        deleted: false,
        createdAt: {
          gte: from,
          lte: to
        }
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate summary statistics
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.cost, 0);
    
    // Group by category
    const categoryMap = new Map<string, { total: number; count: number }>();
    expenses.forEach(exp => {
      const current = categoryMap.get(exp.category.name) || { total: 0, count: 0 };
      categoryMap.set(exp.category.name, {
        total: current.total + exp.cost,
        count: current.count + 1
      });
    });

    const byCategory = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count
    })).sort((a, b) => b.total - a.total);

    return {
      expenses,
      summary: {
        totalExpenses,
        byCategory
      },
      dateRange: { from, to }
    };
  }

  private generateHtmlReport(data: ReportData): string {
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatCurrency = (amount: number) => 
      amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'EUR'
      });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
            .summary { margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .category-summary { margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Expense Report</h1>
          <p>From ${formatDate(data.dateRange.from)} to ${formatDate(data.dateRange.to)}</p>
          
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Expenses:</strong> ${formatCurrency(data.summary.totalExpenses)}</p>
            
            <div class="category-summary">
              <h3>Expenses by Category</h3>
              <table>
                <tr>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Count</th>
                  <th>Average</th>
                </tr>
                ${data.summary.byCategory.map(cat => `
                  <tr>
                    <td>${cat.category}</td>
                    <td>${formatCurrency(cat.total)}</td>
                    <td>${cat.count}</td>
                    <td>${formatCurrency(cat.total / cat.count)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          </div>

          <h2>Detailed Expenses</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
            ${data.expenses.map(exp => `
              <tr>
                <td>${formatDate(exp.createdAt)}</td>
                <td>${exp.description}</td>
                <td>${exp.category.name}</td>
                <td>${formatCurrency(exp.cost)}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
  }

  async sendReport(from: Date, to: Date, includeJson: boolean = false): Promise<void> {
    const reportData = await this.generateReport(from, to);
    const htmlContent = this.generateHtmlReport(reportData);

    const attachments = [];
    if (includeJson) {
      const jsonData = JSON.stringify(reportData, null, 2);
      attachments.push({
        filename: 'expense-report.json',
        content: Buffer.from(jsonData).toString('base64')
      });
    }

    await this.resend.emails.send({
      from: this.recipientEmail,
      to: this.recipientEmail,
      subject: `Expense Report: ${from.toLocaleDateString()} - ${to.toLocaleDateString()}`,
      html: htmlContent,
      attachments
    });
  }
}