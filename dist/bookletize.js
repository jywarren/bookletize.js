

async function createPdf(existingPdfBytes) {
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
  const bookletDoc = await PDFLib.PDFDocument.create();

  const { width, height } = await pdfDoc.getPages()[0].getSize();

  var pageCount = await pdfDoc.getPageCount();
  console.log(pageCount, "page count");

  // pad to a multiple of 4
  while (pageCount % 4 != 0) {
    let page = pdfDoc.addPage([width, height]);
    pageCount = await pdfDoc.getPageCount();
    page.moveTo(width/2, height/2);
    page.drawText("Page " + pageCount);
  }
  console.log(pageCount, "pages padded to multiple of 4");
  const pdfBytes = await pdfDoc.save();
  const origPages = await pdfDoc.getPages();
  console.log(origPages);
  var pageNum = 0;

  // iterate through, plucking out 4 pages at a time and inserting into new sheet
  for (var sheet = 0; sheet < pageCount / 4; sheet++) {

    // double width, same height:
    const bookletPage = bookletDoc.addPage([width * 2, height]);

    if (origPages.length > 0) {
      var embeddedPage = await bookletDoc.embedPage(origPages.splice(origPages.length-2,1)[0]);
      bookletPage.drawPage(embeddedPage, {x: 0, y: 0});
    }

    pageNum += 1;
    if (origPages.length > 0) {
      var embeddedPage2 = await bookletDoc.embedPage(origPages.splice(0,1)[0]);
      bookletPage.drawPage(embeddedPage2, {x: width, y: 0});
    }

    const bookletPage2 = bookletDoc.addPage([width * 2, height]);
    pageNum += 1;
    if (origPages.length > 0) {
      var embeddedPage3 = await bookletDoc.embedPage(origPages.splice(0,1)[0]);
      bookletPage2.drawPage(embeddedPage3, {x: 0, y: 0});
    }

    pageNum += 1;
    if (origPages.length > 0) {
      var embeddedPage4 = await bookletDoc.embedPage(origPages.splice(origPages.length-2,1)[0]);
      bookletPage2.drawPage(embeddedPage4, {x: width, y: 0});
    }

    console.log('added sheet', sheet);
  }

  console.log('completed assembling sheets');
  const pdfDataUri = await bookletDoc.saveAsBase64({ dataUri: true });
  document.getElementById('pdf').src = pdfDataUri;

}

function setup() {

  var reader = new FileReader();

  function handleFile(e) {

    e.preventDefault();
    e.stopPropagation(); // stops the browser from redirecting.
console.log('reader ', e.target.files);

    if (e.target && e.target.files) var file = e.target.files[0];
    else var file = e.dataTransfer.files[0];
    if(!file) return;

    var reader = new FileReader();

    reader.onload = () => {
      createPdf(reader.result);
    };

    reader.readAsArrayBuffer(file);
  
  }

  $('#fileInput,.dropzone')[0].addEventListener('drop', handleFile, false);

  var dropzone = $('.dropzone');
  dropzone.on('dragover', function onDragover(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }, false);

  dropzone.on('dragenter', function onDragEnter(e) {
    dropzone.addClass('hover');
  });

  dropzone.on('dragleave', function onDragLeave(e) {
    dropzone.removeClass('hover');
  });

}
