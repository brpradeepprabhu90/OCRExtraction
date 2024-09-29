using Microsoft.AspNetCore.Mvc;
using OCRExtraction1.Models;
using System.Diagnostics;
using Tesseract;
using System;
using System.Drawing;
using System.IO;
using static System.Net.Mime.MediaTypeNames;

namespace OCRExtraction1.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
        [HttpPost]
        public Task<string> GetTextFromImages([FromBody] OCRExtractionModel ocrModel)
        {
            string path = Path.Combine(AppContext.BaseDirectory, "tessdata");
            byte[] imageBytes = Convert.FromBase64String(ocrModel.Base64Image);
            using (var engine = new TesseractEngine(path, "eng"))
            {
                using (MemoryStream ms = new MemoryStream(imageBytes))
                {
                    Bitmap bitmap = new Bitmap(ms);

                    // Step 3: Convert Bitmap to Pix
                    Pix img = PixConverter.ToPix(bitmap);
                    var pageTest = engine.Process(img);
                     var text = pageTest.GetText();
                    return Task.FromResult(text);
                }
               
            }
            return null;
        }
    }
}
