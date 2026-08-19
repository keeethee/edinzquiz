const fs = require('fs');
const path = require('path');

const PDFParser = require(path.join(__dirname, '../backend/node_modules/pdf2json'));

const filePath = 'd:/Edinz quiz/backend/uploads/1784821801856-947619766.pdf';

console.log('Testing pdf2json...');
const pdfParser = new PDFParser(null, 1);
pdfParser.on("pdfParser_dataError", errData => console.error('Error:', errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
  const rawText = pdfParser.getRawTextContent();
  console.log('pdf2json raw text length:', rawText.length);
  console.log('pdf2json text snippet:', JSON.stringify(rawText.slice(0, 500)));
});

pdfParser.loadPDF(filePath);
