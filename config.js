// Configuration options
const init_phones = [], // Optional. Which graphs to display on initial load. Note: Share URLs will override this set
  DIR = "data/", // Directory where graph files are stored
  data_format = "REW", // Accepts "AudioTools," "REW," or "other"
  default_channels = ["L", "R"], // Which channels to display. Avoid javascript errors if loading just one channel per phone
  default_normalization = "dB", // Sets default graph normalization mode. Accepts "dB" or "Hz"
  default_norm_db = 60, // Sets default dB normalization point
  default_norm_hz = 1000, // Sets default Hz normalization point (500Hz is recommended by IEC)
  max_channel_imbalance = 5, // Channel imbalance threshold to show ! in the channel selector
  alt_layout = true, // Toggle between classic and alt layouts
  alt_sticky_graph = true, // If active graphs overflows the viewport, does the graph scroll with the page or stick to the viewport?
  alt_animated = false, // Determines if new graphs are drawn with a 1-second animation, or appear instantly
  alt_header = false, // Display a configurable header at the top of the alt layout
  alt_tutorial = true, // Display a configurable frequency response guide below the graph
  site_url = "graph.html", // URL of your graph "homepage"
  share_url = true, // If true, enables shareable URLs
  watermark_text = "", // Optional. Watermark appears behind graphs
  watermark_image_url = "logo_new.svg", // Optional. If image file is in same directory as config, can be just the filename
  page_title = "dc 헤마갤 이어폰 측정 DB by ER4SR", // Optional. Appended to the page title if share URLs are enabled
  page_description = "헤마갤 힘내세요 ㅋㅋㄷㄷ",
  accessories = true, // If true, displays specified HTML at the bottom of the page. Configure further below
  externalLinksBar = true, // If true, displays row of pill-shaped links at the bottom of the page. Configure further below
  restricted = false, // Enables restricted mode. More restricted options below
  expandable = false, // Enables button to expand iframe over the top of the parent page
  expandableOnly = false, // Prevents iframe interactions unless the user has expanded it. Accepts "true" or "false" OR a pixel value; if pixel value, that is used as the maximum width at which expandableOnly is used
  headerHeight = "0px", // Optional. If expandable=true, determines how much space to leave for the parent page header
  darkModeButton = true, // Adds a "Dark Mode" button the main toolbar to let users set preference
  targetDashed = true, // If true, makes target curves dashed lines
  targetColorCustom = false, // If false, targets appear as a random gray value. Can replace with a fixed color value to make all targets the specified color, e.g. "black"
  labelsPosition = "default", // Up to four labels will be grouped in a specified corner. Accepts "top-left," bottom-left," "bottom-right," and "default"
  stickyLabels = false, // "Sticky" labels
  analyticsEnabled = false; // Enables Google Analytics 4 measurement of site usage
(extraEnabled = true), // Enable extra features
  (extraUploadEnabled = true), // Enable upload function
  (extraEQEnabled = true), // Enable parametic eq function
  (extraEQBands = 10), // Default EQ bands available
  (extraEQBandsMax = 20), // Max EQ bands available
  (extraToneGeneratorEnabled = false); // Enable tone generator function

// Specify which targets to display
const targets = [
  {
    type: "Neutral",
    files: ["Diffuse Field", "Etymotic", "Free Field", "Innerfidelity ID", "Harman In-Room", "Crinacle"]
  },
  {
    type: "Preference(IEM)",
    files: ["Harman IE 2019 v2", "Harman IE 2017", "Rtings", "Sonarworks", "AutoEQ IE"]
  },
  {
    type: "Preference(Headphones)",
    files: ["Harman OE 2018", "Harman OE 2015"]
  },
  {
    type: "Reviewer",
    files: [
      "Antdroid",
      "Bad Guy",
      "Banbeucmas",
      "Precogvision",
      "Super Review",
    ]
  },
];

// *************************************************************
// Functions to support config options set above; probably don't need to change these
// *************************************************************

// Set up the watermark, based on config options above
function watermark(svg) {
  let wm = svg
    .append("g")
    .attr(
      "transform",
      "translate(" + (pad.l + W / 2) + "," + (pad.t + H / 2 - 20) + ")"
    )
    .attr("opacity", 0.2);

// those x and y coordiates in watermark_image_url are pretty much inversed from my intuition.
// Smaller number makes the watermark to sit in more left or above position, for x and y respectively.
  if (watermark_image_url) {
    wm.append("image").attrs({
      x: 128,
      y: 100,
      width: 250,
      height: 68,
      "xlink:href": watermark_image_url,
    });
  }

  if (watermark_text) {
    wm.append("text")
      .attrs({
        x: 0,
        y: 70,
        "font-size": 18,
        "text-anchor": "middle",
        class: "graph-name",
      })
      .text(watermark_text);
  }
}

// Set up tsvParse (?) with default values for AudioTools and REW measurements
function initTsvParse() {
  if (data_format.toLowerCase() === "audiotools") {
    var dataStart = 3,
      dataEnd = 482;
  } else if (data_format.toLowerCase() === "rew") {
    var dataStart = 15,
      dataEnd = 494;
  } else {
    // If exporting data from something other than AudioTools or REW, edit these vals to indicate on which lines of your text files the measurements data begins and ends
    var dataStart = 6,
      dataEnd = 725;
  }

  tsvParse = (fr) =>
    d3
      .tsvParseRows(fr)
      .slice(dataStart, dataEnd)
      .map((r) => r.map((d) => +d));
}
initTsvParse();

// Apply stylesheet based layout options above
function setLayout() {
  function applyStylesheet(styleSheet) {
    var docHead = document.querySelector("head"),
      linkTag = document.createElement("link");

    linkTag.setAttribute("rel", "stylesheet");
    linkTag.setAttribute("type", "text/css");

    linkTag.setAttribute("href", styleSheet);
    docHead.append(linkTag);
  }

  if (!alt_layout) {
    applyStylesheet("style.css");
  } else {
    applyStylesheet("style-alt.css");
    applyStylesheet("style-alt-theme.css");
  }
}
setLayout();

// Set restricted mode
function setRestricted() {
  if (restricted) {
    max_compare = 2;
    restrict_target = false;
    disallow_target = true;
    premium_html =
      "<h2>You gonna pay for that?</h2><p>To use target curves, or more than two graphs, <a target='_blank' href='https://crinacle.com/wp-login.php?action=register'>subscribe</a> or upgrade to Patreon <a target='_blank' href='https://www.patreon.com/join/crinacle/checkout?rid=3775534'>Silver tier</a> and switch to <a target='_blank' href='https://crinacle.com/graphs/iems/graphtool/premium/'>the premium tool</a>.</p>";
  }
}
setRestricted();

// Configure HTML accessories to appear at the bottom of the page. Displayed only if accessories (above) is true
// There are a few templates here for ease of use / examples, but these variables accept any HTML
const // Short text, center-aligned, useful for a little side info, credits, links to measurement setup, etc.
  simpleAbout = `
        <p class="center">This web software is based on the <a href="https://github.com/mlochbaum/CrinGraph">CrinGraph</a> open source software project.</p>
    `,
  // Slightly different presentation to make more readable paragraphs. Useful for elaborated methodology, etc.
  paragraphs = `
      <p style="text-align: center;"><strong class="center">기여자 목록</strong></p>
      <p class="center" style="text-align: center;">ER4SR, 냥냐냥, 이소양, 아소카, 풀흡음, NX7, Patria</p>
      <p class="center" style="text-align: center;">EX이헤갤러, FH5S=오딘, JohnYang1997, Lastwhitespace, Ricopam, SilicaGel</p>
      <p class="center" style="text-align: center;">뉴비, 뎃데로게., 돼지고닉해드, 보안폴더, 유키나유키농, 전염, 프리스트, 피프틴유저, ㅓㅣ</p>
    `,
  // Customize the count of widget divs, and customize the contents of them. As long as they're wrapped in the widget div, they should auto-wrap and maintain margins between themselves
  widgets = `
        <div class="accessories-widgets">
            <div class="widget">
                <img width="200" src="cringraph-logo.svg"/>
            </div>

            <div class="widget">
                <img width="200" src="cringraph-logo.svg"/>
            </div>

            <div class="widget">
                <img width="200" src="cringraph-logo.svg"/>
            </div>
        </div>
    `,
  // Which of the above variables to actually insert into the page
  whichAccessoriesToUse = paragraphs;

// Configure external links to appear at the bottom of the page. Displayed only if externalLinksBar (above) is true
const linkSets = [
  {
    label: "갤러리로 이동",
    links: [
      {
        name: "헤드폰 마이너 갤러리",
        url: "https://gall.dcinside.com/mgallery/board/lists?id=newheadphone",
      },
    ],
  },
  {
    label: "IEM graph databases",
    links: [
      {
        name: "Audio Discourse",
        url: "https://iems.audiodiscourse.com/",
      },
      {
        name: "Bad Guy",
        url: "https://hbb.squig.link/",
      },
      {
        name: "Banbeucmas",
        url: "https://banbeu.com/graph/tool/",
      },
      {
        name: "HypetheSonics",
        url: "https://www.hypethesonics.com/iemdbc/",
      },
      {
        name: "In-Ear Fidelity",
        url: "https://crinacle.com/graphs/iems/graphtool/",
      },
      {
        name: "Precogvision",
        url: "https://precog.squig.link/",
      },
      {
        name: "Rikudou Goku",
        url: "https://rg.squig.link/",
      },
      {
        name: "Super* Review",
        url: "https://squig.link/",
      },
    ],
  },
  {
    label: "Headphones",
    links: [
      {
        name: "Audio Discourse",
        url: "https://headphones.audiodiscourse.com/",
      },
      {
        name: "In-Ear Fidelity",
        url: "https://crinacle.com/graphs/headphones/graphtool/",
      },
      {
        name: "Super* Review",
        url: "https://squig.link/hp.html",
      },
    ],
  },
];

// Set up analytics
function setupGraphAnalytics() {
  if (analyticsEnabled) {
    const pageHead = document.querySelector("head"),
      graphAnalytics = document.createElement("script"),
      graphAnalyticsSrc = "graphAnalytics.js";

    graphAnalytics.setAttribute("src", graphAnalyticsSrc);
    pageHead.append(graphAnalytics);
  }
}
setupGraphAnalytics();

// If alt_header is enabled, these are the items added to the header
let headerLogoImgUrl = "DC_inside_logo_edit.svg",
  headerLinks = [
    {
      name: "dcinside 헤드폰 마이너 갤러리 이어폰 DB by ER4SR(wienerphilharmoniker)",
      url: "https://gall.dcinside.com/mgallery/board/lists?id=newheadphone",
    },
  ];

let tutorialDefinitions = [
  {
    name: "극저음",
    width: "16%",
    description: "럼블, 저역대의 두께에 관여",
  },
  {
    name: "저음",
    width: "23.3%",
    description: "베이스, 킥드럼 등 낮은 음역대 악기의 기음",
  },
  {
    name: "중음",
    width: "27.4%",
    description: "보컬, 기타, 피아노 등 대부분의 악기의 기음",
  },
  {
    name: "중고음",
    width: "15.9%",
    description: "악기들의 배음, 명료도에 관여",
  },
  {
    name: "고음",
    width: "7.4%",
    description: "치찰음, 심벌, 하이햇에 관여",
  },
  {
    name: "초고음",
    width: "10%",
    description: "'에어리함', 금속성 느낌에 관여",
  },
];

let confidenceDefinitions = [
  {
    name: "비신뢰구간",
    width: "14.2%",
    description: "삽입깊이에 따라 FR이 달라져 신뢰할 수 없는 구간. 공진 피크가 시작되는 구간부터이며, 측정치끼리의 비교에는 문제 없으나 실청감시 착용 위치에 따라 측정된 FR과는 다른 소리가 날 수 있음. 특히 8kHz 근처의 피크는(ER시리즈는 초고역에 존재) 커플러 공진 피크로 실제보다 더 과장됨.",
  },
]
