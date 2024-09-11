document.addEventListener('DOMContentLoaded', async function () {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: getHeaderDataAndNumbers
    });

    if (results[0]?.result) {
      const data = results[0].result;
      document.getElementById('headerData').innerText = (data.header || 'Header not found') + '.';
      document.getElementById('number').innerText = data.numbers || 'Numbers not found';
    } else {
      console.error('No data returned from content script.');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  // Add event listener to copy button
  document.getElementById('copyButton').addEventListener('click', function () {
    const numbers = document.getElementById('number').innerText;
    const header = document.getElementById('headerData').innerText;
    const fullText = header + "\n" + numbers;
    copyToClipboard(fullText);
  });
});

// Function to scrape header and numbers from the page
function getHeaderDataAndNumbers() {
  try {
    const headerXPath = "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[2]/header/div[1]/h6[1]";
    const header = document.evaluate(headerXPath, document, null, XPathResult.STRING_TYPE, null).stringValue.trim() || 'No header available';
    
    const pairs = [
      { xPath1: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[1]/div[1]/div/p[1]", xPath2: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[1]/div[1]/div/p[2]" },
      { xPath1: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[2]/div[1]/div/p[1]", xPath2: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[2]/div[1]/div/p[2]" },
      { xPath1: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[3]/div[1]/div/p[1]", xPath2: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[3]/div[1]/div/p[2]" },
      { xPath1: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[4]/div[1]/div/p[1]", xPath2: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[4]/div[1]/div/p[2]" },
      { xPath1: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[5]/div[1]/div/p[1]", xPath2: "/html/body/div[1]/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[5]/div[1]/div/p[2]" }
    ];

    let result = '';
    pairs.forEach(pair => {
      const result1 = document.evaluate(pair.xPath1, document, null, XPathResult.STRING_TYPE, null).stringValue.trim();
      const result2 = document.evaluate(pair.xPath2, document, null, XPathResult.STRING_TYPE, null).stringValue.trim();
      result += `${result2 || 'N/A'} from ${result1 || 'N/A'}.\n`;
    });

    return { header: header, numbers: result.trim() };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { header: 'Error fetching header', numbers: 'Error fetching numbers' };
  }
}

// Function to copy text to clipboard and show/hide the "Copied" notification
function copyToClipboard(text) {
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);

  // Show notification
  const notification = document.getElementById('copyNotification');
  notification.classList.add('show');

  // Hide notification after 2 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 2000);
}
