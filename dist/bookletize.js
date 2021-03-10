const { PDFDocument, StandardFonts, rgb } = PDFLib

async function createPdf(existingPdfBytes, options) {
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
  const bookletDoc = await PDFLib.PDFDocument.create();

  options = options || {};
  const { width, height } = await pdfDoc.getPages()[0].getSize();

  var pageCount = await pdfDoc.getPageCount();
  console.log(pageCount, "page count");

  // pad to a multiple of 4
  while (pageCount % 4 != 0) {
    let page = pdfDoc.addPage([width, height]);
    pageCount = await pdfDoc.getPageCount();
    page.moveTo(width/2, height/2);
    page.drawText("Page " + pageCount, {
      size: 7,
      color: rgb(1,1,1)
    });
  }
  console.log(pageCount, "pages padded to multiple of 4");
  const origPages = await pdfDoc.getPages();
  console.log(origPages);
  var pageNum = 0;

  // iterate through, plucking out 4 pages at a time and inserting into new sheet
  for (var sheet = 0; sheet < pageCount / 4; sheet++) {

    // double width, same height:
    const bookletPage = bookletDoc.addPage([width * 2, height]);

    // this function can be configured in options, and is what fetches the "next" page from the original stack (and removes it)
    let getPage = options.getPage || async function getPage(originalPosition, placement, originalPages, _bookletDoc, _bookletPage) {
      if (originalPages.length > 0) {
        var embeddedPage = await _bookletDoc.embedPage(originalPages.splice(originalPosition,1)[0]);
        _bookletPage.drawPage(embeddedPage, placement);
      }
    }

    await getPage(origPages.length-1,{x: 0, y: 0}, origPages, bookletDoc, bookletPage)
    pageNum += 1;

    await getPage(0,{x: width, y: 0}, origPages, bookletDoc, bookletPage)
    pageNum += 1;

    const bookletPage2 = bookletDoc.addPage([width * 2, height]);

    await getPage(0,{x: 0, y: 0}, origPages, bookletDoc, bookletPage2)
    pageNum += 1;

    await getPage(origPages.length-1,{x: width, y: 0}, origPages, bookletDoc, bookletPage2)
    pageNum += 1;

    console.log('added sheet', sheet);
  }

  console.log('completed assembling sheets');
  $('.fa-spin').addClass('hidden');
//  const pdfDataUri = await bookletDoc.saveAsBase64({ dataUri: true });
//  document.getElementById('pdf').src = pdfDataUri;
  const pdfBytes = await bookletDoc.save();
  var blob = new Blob([pdfBytes], {type: "application/pdf"});
  var link = window.URL.createObjectURL(blob);

  PDFObject.embed(link, "#pdf" );

}

function setup() {

  var reader = new FileReader();

  function handleFile(e) {

    $('.fa-spin').removeClass('hidden');

    e.preventDefault();
    e.stopPropagation(); // stops the browser from redirecting.
    console.log('filereader ', e, e.target.files);

    if (e.target && e.target.files) var file = e.target.files[0];
    else var file = e.dataTransfer.files[0];
    if(!file) return;

    var reader = new FileReader();

    reader.onload = () => {
      createPdf(reader.result);
    };

    reader.readAsArrayBuffer(file);
  
  }

  $('.dropzone')[0].addEventListener('drop', handleFile, false);
  $('#fileInput').on('change drop', handleFile);


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
