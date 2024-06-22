async function translateText(text) {
    if (text === "") {
        return null
    }
    if (text === null) {
        return null
    }
    const apiUrl = `https://translate.toil.cc/translate/?text=${encodeURIComponent(text)}&lang=ru`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        return data.text[0];
    } catch (error) {
        console.error('Ошибка при запросе перевода:', error);
        return null;
    }
}

function containsAny(str, substrings) {
    for (let substring of substrings) {
        if (str.includes(substring)) {
            return true;
        }
    }
    return false;
}

async function translateHTML(html, div) {
    let regex = /(?<=<\/b><\/a>)([^<]+)/g;
    let matches = html.match(regex);

    console.log(matches);
    if (!matches) {
        if (div.children.length === 0) {
            const translatedText = await translateText(div.innerText);
            console.log(div.innerText + " -> " + translatedText);
            html = html.replace(div.innerText, translatedText);

            return html
        }
        return html;
    }

    for (let match of matches) {
        const translatedText = await translateText(match);
        console.log(match + " -> " + translatedText);
        html = html.replace(match, translatedText);
    }

    return html;
}

async function translate_messageHTML(html) {
    const divs = document.querySelectorAll('div');

    const emptyDivs = [];

    divs.forEach(function(div) {
        if (!div.className && !div.id && !div.style.cssText) {
            emptyDivs.push(div);
        }
    });

    if (emptyDivs.length === 0) {
        return;
    }

    for (let div of emptyDivs) {
        let message = div.textHTML;
        if (div.childNodes.length < 1){
            console.log("skip")
        } else {
            if (div.childNodes.length > 1) {
                console.log("skip");
            } else {
                let message = div.innerText
                let substrings = ["<div", "<a", "<b", 'class="', "</div>", 'id="', "</span>", "<span"];
                if (containsAny(message, substrings) === true) {
                    console.log("skip")
                } else {
                    const translatedText = await translateText(message);
                    console.log(div.innerText + " -> " + translatedText);
                    div.innerText = translatedText;
                }
            }
        }
    }
}




function sleep(ms) {
    return new Promise(
      resolve => setTimeout(resolve, ms)
    );
}
async function translateDivs() {
    while (true) {
        console.log("check");
        const divs1 = await getDivs1();
        for (const div of divs1) {
            let text = div.innerHTML;
            if (div.translated === true) {
                console.log("Skip translate");
            } else {
                let result = await translateHTML(text, div);
                console.log(result);
                div.innerHTML = result;
                console.log(div);
                div.translated = true;
            }
        }

        const divs2 = await getDivs2();
        for (const div of divs2) {
            if (div.translated === true) {
                console.log("Skip translate");
            } else {
                let result = await translate_messageHTML(div);
                div.translated = true;
            }
        }
        await sleep(5000);
    }
}

async function getDivs1() {
    return document.querySelectorAll('.text-base.leading-5.text-black-100.dark\\:text-white');
}

async function getDivs2() {
    return document.querySelectorAll('.flex.flex-col.items-end.gap-2')
}

$(window).on('load', function(){
    console.log("Start translate");
    translateDivs();
});
