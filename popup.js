document.addEventListener('DOMContentLoaded', function () {
  const discordButton = document.getElementById('sendToDiscordButton'); // Assume the button has this ID
  let isSendingToDiscord = false; // Flag to track sending status
  let lastRequestId = null; // Track unique request

  // Load the saved webhook URL or set default
  const webhookUrlInput = document.getElementById('webhookUrl');
  webhookUrlInput.value = localStorage.getItem('webhookUrl') || '';

  // Add event listener to the webhook URL input to save the URL
  webhookUrlInput.addEventListener('change', function () {
    localStorage.setItem('webhookUrl', webhookUrlInput.value);
  });

  if (discordButton && !discordButton.dataset.listenerAdded) {
    discordButton.addEventListener('click', function () {
      if (isSendingToDiscord) {
        console.log('Message is already being sent. Please wait.');
        return; // Exit early if the message is already in the process of being sent
      }

      // Set flag to true to prevent further sends
      isSendingToDiscord = true;
      lastRequestId = Date.now(); // Unique request ID based on timestamp
      console.log('Starting to send message to Discord...', lastRequestId);

      const numbers = document.getElementById('number').innerText;
      const header = document.getElementById('headerData').innerText;
      const fullText = numbers ? `${header} ${numbers.replace(/\n/g, ' ')}` : header;

      // Get the webhook URL from the input field
      const webhookUrl = webhookUrlInput.value;

      sendToDiscord(fullText, webhookUrl, lastRequestId)
        .then(() => {
          console.log('Message sent successfully.', lastRequestId);
        })
        .catch((error) => {
          console.error('Error sending message:', error);
        })
        .finally(() => {
          // Reset flag after sending is complete
          isSendingToDiscord = false;
          console.log('Sending process finished for request:', lastRequestId);
        });
    });

    // Set flag so that listener is not added again
    discordButton.dataset.listenerAdded = true;
  }

  const themeDropdown = document.getElementById('themeDropdown');

  // Load the saved theme or default
  const savedTheme = localStorage.getItem('theme') || 'default';
  applyTheme(savedTheme);
  themeDropdown.value = savedTheme;

  // Handle theme changes
  themeDropdown.addEventListener('change', function () {
    const selectedTheme = themeDropdown.value;
    applyTheme(selectedTheme);
    // Save the selected theme to localStorage
    localStorage.setItem('theme', selectedTheme);
  });

  // Fetch data and handle copy functionality
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

          // Check if numbers were returned and update UI accordingly
          const numberElement = document.getElementById('number');
          if (data.numbers && data.numbers.trim() !== '') {
            numberElement.innerText = data.numbers;
          } else {
            numberElement.innerText = ''; // Clear the numbers if not found
          }
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

    // Prepare full text without "from" if numbers are not present
    const fullText = numbers ? `${header} ${numbers.replace(/\n/g, ' ')}` : header;
    copyToClipboard(fullText);
  });
});

// Function to send data to Discord webhook with unique requestId
function sendToDiscord(data, webhookUrl, requestId) {
  console.log('Request to send message initiated:', requestId);

  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: data
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    console.log('Message sent for requestId:', requestId);
    return response.json();
  })
  .catch(error => {
    console.error('Error in request:', requestId, error);
  });
}

// Function to apply the selected theme
function applyTheme(theme) {
  fetch('colors.json')
    .then(response => response.json())
    .then(colors => {
      const themeColors = colors[theme] || colors.default; // Default to 'default' if theme is not found

      // Apply gradient background
      document.body.style.background = `linear-gradient(135deg, ${themeColors.backgroundGradient.start}, ${themeColors.backgroundGradient.end})`;

      // Apply titleBox styles
      const titleBox = document.getElementById('titleBox');
      titleBox.style.backgroundColor = themeColors.titleBox.backgroundColor;
      titleBox.style.color = themeColors.titleBox.fontColor;

      // Apply copyButton styles
      const copyButton = document.getElementById('copyButton');
      copyButton.style.background = `linear-gradient(135deg, ${themeColors.copyButton.backgroundGradientStart}, ${themeColors.copyButton.backgroundGradientEnd})`;
      copyButton.style.color = themeColors.copyButton.fontColor;

      // Change hover color of copyButton dynamically
      copyButton.addEventListener('mouseenter', () => {
        copyButton.style.background = themeColors.copyButton.hoverColor;
      });
      copyButton.addEventListener('mouseleave', () => {
        copyButton.style.background = `linear-gradient(135deg, ${themeColors.copyButton.backgroundGradientStart}, ${themeColors.copyButton.backgroundGradientEnd})`;
      });

      // Apply headerData color
      const headerData = document.getElementById('headerData');
      headerData.style.color = themeColors.headerData.fontColor;

      // Apply number color
      const number = document.getElementById('number');
      number.style.color = themeColors.number.fontColor;

      // Apply notification styles
      const notification = document.getElementById('copyNotification');
      notification.style.backgroundColor = themeColors.notification.backgroundColor;
      notification.style.color = themeColors.notification.fontColor;
    })
    .catch(error => console.error('Error loading colors:', error));
}

function getHeaderDataAndNumbers() {
  try {
    // XPath for the header 
    const headerXPath = "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[2]/header/div[1]/h6[1]";
    const header = document.evaluate(headerXPath, document, null, XPathResult.STRING_TYPE, null).stringValue || 'No system selected';

    // Locate the node-inlay containing the header name
    const nodeInlayXPath = `//div[contains(@class, 'node-inlay') and .//span[contains(text(), '${header}')]]`;
    const nodeInlay = document.evaluate(nodeInlayXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    let securityStatus = 'N/A'; // Default value if not found
    if (nodeInlay) {
      // Extract the security status
      const securityTypeNode = nodeInlay.querySelector('.system-type');
      if (securityTypeNode) {
        securityStatus = securityTypeNode.textContent.trim();
      }
    }

    // XPath pairs for the scraped data
    const pairs = [
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[1]/h3/div/div/p[1]", // jita
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[1]/h3/div/div/p[2]" // jumps
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[2]/h3/div/div/p[1]", // hek
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[2]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[3]/h3/div/div/p[1]", // amarr
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[3]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[4]/h3/div/div/p[1]", // rens
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[4]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[5]/h3/div/div/p[1]", // dodixie
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[5]/h3/div/div/p[2]"
      }
    ];

    let numbersOutput = ''; // Collect valid number outputs
    pairs.forEach(pair => {
      const result1 = document.evaluate(pair.xPath1, document, null, XPathResult.STRING_TYPE, null).stringValue || null;
      const result2 = document.evaluate(pair.xPath2, document, null, XPathResult.STRING_TYPE, null).stringValue || null;

      if (result1 && result2) {
        numbersOutput += `${result2} from ${result1}.\n`; // Only add valid results
      }
    });

    // Trim to remove extra spaces
    numbersOutput = numbersOutput.trim();

    // Format header data
    let connectionText = '';
    if (securityStatus !== 'N/A') {
      connectionText = securityStatus.startsWith('C') ? `${securityStatus}.` : `${securityStatus} Connection.`;
    }

    return {
      header: connectionText ? `${connectionText} ${header}` : header, // Format header data
      numbers: numbersOutput // Return only valid results
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      header: 'Error fetching header',
      numbers: 'Error fetching numbers'
    };
  }
}

// Function to copy text to clipboard and show notification
function copyToClipboard(text) {
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);

  // Show the "Copied!" notification
  const notification = document.getElementById('copyNotification');
  notification.classList.add('show'); // Add the 'show' class to display the notification

  // Hide the notification after 2 seconds
  setTimeout(() => {
    notification.classList.remove('show'); // Remove the 'show' class to hide the notification
  }, 2000); // 2000 milliseconds = 2 seconds
}
