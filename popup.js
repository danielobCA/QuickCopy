document.addEventListener('DOMContentLoaded', function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: getHeaderDataAndNumbers
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        const data = results[0].result;
        if (data) {
          // Add a period to the end of the header
          document.getElementById('headerData').innerText = (data.header || 'Header not found') + '.';
          document.getElementById('number').innerText = data.numbers || 'Numbers not found';
        } else {
          console.error('No data returned from the content script.');
        }
      }
    });
  });

  // Add event listener to copy button
  document.getElementById('copyButton').addEventListener('click', function () {
    const numbers = document.getElementById('number').innerText;
    const header = document.getElementById('headerData').innerText;
    const fullText = header + "\n" + numbers;
    copyToClipboard(fullText);
  });
});

function getHeaderDataAndNumbers() {
  try {
    // XPath for the header
    const headerXPath = "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[2]/header/div[1]/h6[1]";
    const header = document.evaluate(headerXPath, document, null, XPathResult.STRING_TYPE, null).stringValue || 'No system detected';
    
    // XPath pairs for the scraped data
    const pairs = [
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[1]/h3/div/div/p[1]", //jita
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[1]/h3/div/div/p[2]" // jumps
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[2]/h3/div/div/p[1]", //hek 
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[2]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[3]/h3/div/div/p[1]", //amarr
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[3]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[4]/h3/div/div/p[1]", //rens
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[4]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[5]/h3/div/div/p[1]", //dodixie
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[5]/h3/div/div/p[2]"
      }
    ];

    let result = '';
    
    pairs.forEach(pair => {
      const result1 = document.evaluate(pair.xPath1, document, null, XPathResult.STRING_TYPE, null).stringValue || 'N/A';
      const result2 = document.evaluate(pair.xPath2, document, null, XPathResult.STRING_TYPE, null).stringValue || 'N/A';
      result += result2 + " from " + result1 + ".\n"; // Add period at the end of each line
    });

    return {
      header: header,
      numbers: result.trim()
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      header: 'Error fetching header',
      numbers: 'Error fetching numbers'
    };
  }
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
}
