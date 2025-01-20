import { Resend } from 'resend';
import { Prisma } from '@prisma/client';
import prisma from '@prisma/prisma';
import { ReportExpenseData, ReportDayLogsData } from '@utils/types';

export class ExpenseReporter {
  private resend: Resend;
  private senderEmail: string;
  private recipientEmail: string;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    if (!process.env.SENDER_EMAIL) {
      throw new Error('SENDER_EMAIL environment variable is not set');
    }
    if (!process.env.RECIPIENT_EMAIL) {
      throw new Error('RECIPIENT_EMAIL environment variable is not set');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.senderEmail = process.env.SENDER_EMAIL;
    this.recipientEmail = process.env.RECIPIENT_EMAIL;
  }

  private async generateExpenses(
    from: Date,
    to: Date
  ): Promise<ReportExpenseData> {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        deleted: false,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.cost, 0);

    const categoryMap = new Map<string, { total: number; count: number }>();
    expenses.forEach(exp => {
      const current = categoryMap.get(exp.category.name) || {
        total: 0,
        count: 0
      };
      categoryMap.set(exp.category.name, {
        total: current.total + exp.cost,
        count: current.count + 1
      });
    });

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        total: stats.total,
        count: stats.count
      }))
      .sort((a, b) => b.total - a.total);

    return {
      expenses,
      summary: {
        totalExpenses,
        byCategory
      },
      dateRange: { from, to }
    };
  }

  private async generateDayLogs(
    from: Date,
    to: Date
  ): Promise<ReportDayLogsData> {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const dayLogs = await prisma.dayLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      dayLogs,
      dateRange: { from, to }
    };
  }

  private generateHtmlReport(
    expenses: ReportExpenseData,
    dayLogs: ReportDayLogsData
  ): string {
    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', {
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
            .rating {
              --star-size: 20px;
              --star-background: #ffd700;
              --star-color: #ddd;
              --percent: calc(var(--rating) * 20%);
              display: inline-block;
              font-size: var(--star-size);
              font-family: Times; /* Ensures better star symbol rendering */
              line-height: 1;
              background: linear-gradient(90deg, 
                var(--star-background) var(--percent), 
                var(--star-color) var(--percent)
              );
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .rating::before {
              content: '★★★★★';
              letter-spacing: 3px;
            }
          </style>
        </head>
        <body>
          <h1>Diary Report</h1>
          <p>From ${formatDate(expenses.dateRange.from)} to ${formatDate(expenses.dateRange.to)}</p>
          
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Expenses:</strong> ${formatCurrency(expenses.summary.totalExpenses)}</p>
            
            <div class="category-summary">
              <h3>Expenses by Category</h3>
              <table>
                <tr>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Count</th>
                </tr>
                ${expenses.summary.byCategory
                  .map(
                    cat => `
                  <tr>
                    <td>${cat.category}</td>
                    <td>${formatCurrency(cat.total)}</td>
                    <td>${cat.count}</td>
                  </tr>
                `
                  )
                  .join('')}
              </table>
            </div>
          </div>

          <h2>Detailed Expenses</h2>
          <table>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
            ${expenses.expenses
              .map(
                exp => `
              <tr>
                <td>${exp.id}</td>
                <td>${formatDate(exp.createdAt)}</td>
                <td>${exp.description}</td>
                <td>${exp.category.name}</td>
                <td>${formatCurrency(exp.cost)}</td>
              </tr>
            `
              )
              .join('')}
          </table>

          <h2>Day Logs Report</h2>
          <p>From ${formatDate(dayLogs.dateRange.from)} to ${formatDate(dayLogs.dateRange.to)}</p>
          <table>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Stars</th>
              <th>Log</th>
            </tr>
            ${dayLogs.dayLogs
              .filter(
                (dl): dl is typeof dl & { comments: any[] } =>
                  dl.comments !== null && Array.isArray(dl.comments)
              )
              .map(
                dl => `
                <tr>
                  <td>${dl.id}</td>
                  <td>${formatDate(dl.createdAt)}</td>
                  <td><div class="rating" style="--rating: ${Math.round(dl.comments.reduce((a, c) => a + c.stars, 0) / dl.comments.length)};"></div></td>
                  <td>${dl.comments.map(c => `- ${c.text}`).join('<br>')}</td>
                </tr>
              `
              )
              .join('')}
          </table>
        </body>
      </html>
    `;
  }

  async sendReport(
    from: Date,
    to: Date,
    includeJson: boolean = false
  ): Promise<void> {
    const reportExpenseData = await this.generateExpenses(from, to);
    const reportDayLogData = await this.generateDayLogs(from, to);
    const htmlContent = this.generateHtmlReport(
      reportExpenseData,
      reportDayLogData
    );

    const attachments = [];
    if (includeJson) {
      const jsonExpenseData = JSON.stringify(reportExpenseData, null, 2);
      attachments.push({
        filename: 'expenses.json',
        content: Buffer.from(jsonExpenseData).toString('base64'),
        contentType: 'application/json'
      });

      const jsonDayLogData = JSON.stringify(reportDayLogData, null, 2);
      attachments.push({
        filename: 'day-logs.json',
        content: Buffer.from(jsonDayLogData).toString('base64'),
        contentType: 'application/json'
      });
    }

    try {
      const response = await this.resend.emails.send({
        from: this.senderEmail,
        to: this.recipientEmail,
        subject: `Diary Report: ${from.toLocaleDateString()} - ${to.toLocaleDateString()}`,
        html: htmlContent,
        attachments
      });

      if (response.error) {
        throw new Error('Failed to send email: No id returned from Resend');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error}`);
    }
  }
}
