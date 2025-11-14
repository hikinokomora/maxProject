const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PdfService {
  constructor() {
    // Создаём папку для временных PDF файлов
    this.pdfDir = path.join(__dirname, '../temp/pdfs');
    if (!fs.existsSync(this.pdfDir)) {
      fs.mkdirSync(this.pdfDir, { recursive: true });
    }
  }

  /**
   * Генерирует PDF справку об обучении
   */
  async generateStudyCertificate(studentData) {
    return new Promise((resolve, reject) => {
      try {
        const filename = `certificate_${studentData.userId}_${Date.now()}.pdf`;
        const filepath = path.join(this.pdfDir, filename);
        
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // Заголовок
        doc.fontSize(20).text('СПРАВКА ОБ ОБУЧЕНИИ', { align: 'center' });
        doc.moveDown();
        
        // Дата выдачи
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU');
        doc.fontSize(10).text(`Выдана: ${dateStr}`, { align: 'right' });
        doc.moveDown(2);
        
        // Основной текст
        doc.fontSize(12);
        doc.text(`Настоящая справка выдана ${studentData.name} в том, что`, { continued: false });
        doc.text(`он(а) является студентом(кой) ${studentData.institute || 'университета'}.`);
        doc.moveDown();
        
        doc.text(`Направление подготовки: ${studentData.direction || 'не указано'}`);
        doc.text(`Группа: ${studentData.group || 'не указана'}`);
        doc.text(`Курс: ${studentData.course || 'не указан'}`);
        doc.text(`Форма обучения: ${studentData.paid ? 'платная' : 'бюджетная'}`);
        doc.moveDown(2);
        
        doc.text(`Справка выдана для предоставления по месту требования.`);
        doc.moveDown(3);
        
        // Подпись
        doc.text('_____________________', { continued: true });
        doc.text('     _____________________');
        doc.fontSize(9).text('        (подпись)                       (расшифровка подписи)', { align: 'left' });
        
        // Печать
        doc.moveDown(2);
        doc.fontSize(10).text('М.П.', { align: 'left' });
        
        doc.end();
        
        stream.on('finish', () => {
          resolve({ success: true, filepath, filename });
        });
        
        stream.on('error', (err) => {
          reject({ success: false, message: err.message });
        });
        
      } catch (e) {
        reject({ success: false, message: e.message });
      }
    });
  }

  /**
   * Генерирует PDF с расписанием
   */
  async generateSchedulePdf(scheduleData, groupName) {
    return new Promise((resolve, reject) => {
      try {
        const filename = `schedule_${groupName}_${Date.now()}.pdf`;
        const filepath = path.join(this.pdfDir, filename);
        
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // Заголовок
        doc.fontSize(18).text(`РАСПИСАНИЕ ЗАНЯТИЙ`, { align: 'center' });
        doc.fontSize(14).text(`Группа: ${groupName}`, { align: 'center' });
        doc.moveDown(2);
        
        // Расписание по дням
        scheduleData.forEach(day => {
          doc.fontSize(14).text(day.day, { underline: true });
          doc.moveDown(0.5);
          
          day.lessons.forEach(lesson => {
            doc.fontSize(11);
            doc.text(`${lesson.time}  ${lesson.subject}`, { continued: true });
            doc.fontSize(9).text(`  (${lesson.room})`, { continued: false });
            if (lesson.teacher) {
              doc.fontSize(9).text(`       Преподаватель: ${lesson.teacher}`);
            }
            doc.moveDown(0.3);
          });
          
          doc.moveDown();
        });
        
        // Футер
        doc.fontSize(8).text(`Сгенерировано: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (МСК)`, {
          align: 'center',
          color: 'gray'
        });
        
        doc.end();
        
        stream.on('finish', () => {
          resolve({ success: true, filepath, filename });
        });
        
        stream.on('error', (err) => {
          reject({ success: false, message: err.message });
        });
        
      } catch (e) {
        reject({ success: false, message: e.message });
      }
    });
  }

  /**
   * Удаляет временный PDF файл
   */
  async deletePdf(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { success: true };
      }
      return { success: false, message: 'File not found' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Очищает старые PDF файлы (старше 1 часа)
   */
  async cleanupOldPdfs() {
    try {
      const files = fs.readdirSync(this.pdfDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      files.forEach(file => {
        const filepath = path.join(this.pdfDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtimeMs > oneHour) {
          fs.unlinkSync(filepath);
          console.log(`[PDF Service] Cleaned up old file: ${file}`);
        }
      });
      
      return { success: true, message: 'Cleanup completed' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}

module.exports = new PdfService();
