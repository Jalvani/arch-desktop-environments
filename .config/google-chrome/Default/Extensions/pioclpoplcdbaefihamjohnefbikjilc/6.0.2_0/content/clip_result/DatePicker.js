function DatePicker(container, callback) {
  "use strict";

  // from https://github.com/jquery/jquery-ui/tree/master/ui/i18n
  var locales = {
    da: {
      dateFormat: "dd-mm-yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    de: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    enau: {
      dateFormat: "dd/mm/yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    engb: {
      dateFormat: "dd/mm/yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    ennz: {
      dateFormat: "dd/mm/yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    enus: {
      dateFormat: "mm/dd/yy",
      firstDay: 0,
      showMonthAfterYear: false
    },
    es: {
      dateFormat: "dd/mm/yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    fi: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    frca: {
      dateFormat: "yy-mm-dd",
      firstDay: 0,
      showMonthAfterYear: false
    },
    frch: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    fr: {
      dateFormat: "dd/mm/yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    hu: {
      dateFormat: "yy.mm.dd.",
      firstDay: 1,
      showMonthAfterYear: true
    },
    id: {
      dateFormat: "dd/mm/yy",
      firstDay: 0,
      showMonthAfterYear: false
    },
    itch: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    it: {
      dateFormat: "dd/mm/yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    ja: {
      dateFormat: "yy/mm/dd",
      firstDay: 0,
      showMonthAfterYear: true
    },
    ko: {
      dateFormat: "yy-mm-dd",
      firstDay: 0,
      showMonthAfterYear: true
    },
    ms: {
      dateFormat: "dd/mm/yy",
      firstDay: 0,
      showMonthAfterYear: false
    },
    nb: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    nlbe: {
      dateFormat: "dd/mm/yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    nl: {
      dateFormat: "dd-mm-yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    pl: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    ptbr: {
      dateFormat: "dd/mm/yy",
      firstDay: 0,
      showMonthAfterYear: false
    },
    pt: {
      dateFormat: "dd/mm/yy",
      firstDay: 0,
      showMonthAfterYear: false
    },
    ro: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    ru: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    srsr: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    sr: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    sv: {
      dateFormat: "yy-mm-dd",
      firstDay: 1,
      showMonthAfterYear: false
    },
    th: {
      dateFormat: "dd/mm/yy",
      firstDay: 0,
      showMonthAfterYear: false
    },
    tr: {
      dateFormat: "dd.mm.yy",
      firstDay: 1,
      showMonthAfterYear: false
    },
    vi: {
      dateFormat: "dd/mm/yy",
      firstDay: 0,
      showMonthAfterYear: false
    },
    zhcn: {
      dateFormat: "yy-mm-dd",
      dowIndex: 2, // character in the day of week that should be used in abbrev
      firstDay: 1,
      showMonthAfterYear: true
    },
    zhhk: {
      dateFormat: "dd-mm-yy",
      dowIndex: 2,
      firstDay: 0,
      showMonthAfterYear: true
    },
    zhtw: {
      dateFormat: "yy/mm/dd",
      dowIndex: 2,
      firstDay: 1,
      showMonthAfterYear: true
    }
  };
  var months = [ "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December" ];
  var dow = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];

  var now = new Date();
  var showingMonth = now.getMonth();
  var showingYear = now.getFullYear();
  var locale = window.navigator.language.replace(/[^a-z]/ig, "").toLowerCase();
  if (!locales[locale]) {
    locale = "enus";
  }
  var selected;

  var monthYearHeader;
  var weeks = [];

  function format(date) {
    var monthRep = date.getMonth() + 1;
    if (monthRep < 10) {
      monthRep = "&nbsp;" + monthRep;
    }
    var dateRep = date.getDate();
    if (dateRep < 10) {
      dateRep = "&nbsp;" + dateRep;
    }
    var yearRep = date.getFullYear();
    if (yearRep < 10) {
      yearRep = "&nbsp;&nbsp;&nbsp;" + yearRep;
    } else if (yearRep < 100) {
      yearRep = "&nbsp;&nbsp;" + yearRep;
    } else if (yearRep < 1000) {
      yearRep = "&nbsp;" + yearRep;
    }
    var string = locales[locale].dateFormat
      .replace("mm", "<span id=\"selectedMonth\">" + monthRep + "</span>")
      .replace("dd", "<span id=\"selectedDate\">" + dateRep + "</span>")
      .replace("yy", "<span id=\"selectedYear\">" + yearRep) + "</span> ";
    if (date.getHours() == 0 || date.getHours() == 12) {
      string += "<span id=\"selectedHour\">12</span>";
    } else {
      if (date.getHours() % 12 < 10) {
        string += "<span id=\"selectedHour\">&nbsp;" + (date.getHours() % 12) + "</span>";
      } else {
        string += "<span id=\"selectedHour\">" + (date.getHours() % 12) + "</span>";
      }
    }
    if (date.getMinutes() < 10) {
      string += ":<span id=\"selectedMinute\">0" + date.getMinutes() + "</span> ";
    } else {
      string += ":<span id=\"selectedMinute\">" + date.getMinutes() + "</span> ";
    }
    if (date.getHours() < 12) {
      string += "<span id=\"selectedMeridian\">AM</span>";
    } else {
      string += "<span id=\"selectedMeridian\">PM</span>";
    }
    return string;
  }

  function genDayHeaders() {
    var div = document.createElement("div");
    div.id = "dowHeader";
    for (var i = 0; i < 7; i++) {
      var day = document.createElement("div");
      day.className = "dow";
      day.innerText = Browser.i18n.getMessage(dow[(locales[locale].firstDay + i) % 7]).charAt(locales[locale].dowIndex || 0).toUpperCase();
      div.appendChild(day);
    }
    return div;
  }

  function genMonthYearHeader() {
    if (locales[locale].showMonthAfterYear) {
      monthYearHeader.innerText = showingYear + " " + Browser.i18n.getMessage(months[showingMonth]).toUpperCase();
    } else {
      monthYearHeader.innerText = Browser.i18n.getMessage(months[showingMonth]).toUpperCase() + " " + showingYear;
    }
  }

  function genWeeks() {
    var temp = new Date(showingYear, showingMonth, 1);
    var diff = temp.getDay() - locales[locale].firstDay;
    if (diff < 0) {
      diff += 7;
    }
    temp = new Date(temp - (diff * 24 * 60 * 60 * 1000)); // first day of month
    var prevDate = 0; // used to determine if DST is ending
    var dst = false; // keeps track of whether DST ended this month
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 7; j++) {
        var d;
        if (dst) {
          d = new Date(temp - (-i * (6 * 24 * 60 * 60 * 1000 + 25 * 60 * 60 * 1000) - j * 24 * 60 * 60 * 1000));
        } else {
          d = new Date(temp - (-i * 7 * 24 * 60 * 60 * 1000 - j * 24 * 60 * 60 * 1000));
        }
        if (prevDate == d.getDate()) {
          d = new Date(temp - (-i * 7 * 24 * 60 * 60 * 1000 - j * 25 * 60 * 60 * 1000));
          dst = true;
        }
        prevDate = d.getDate();
        weeks[i].children[j].innerText = d.getDate();
        weeks[i].children[j].removeAttribute("id");
        weeks[i].children[j].className = weeks[i].children[j].className.replace(/\s*(nextMonth|previousMonth|selected)/g, "");
        if (d.getMonth() > showingMonth) {
          weeks[i].children[j].className += " nextMonth";
        } else if (d.getMonth() < showingMonth) {
          weeks[i].children[j].className += " previousMonth";
        } else {
          if (d.getMonth() == now.getMonth() && d.getDate() == now.getDate() && d.getFullYear() == now.getFullYear()) {
            weeks[i].children[j].id = "today";
          }
          if (selected && d.getMonth() == selected.month && d.getDate() == selected.date && d.getFullYear() == selected.year) {
            weeks[i].children[j].className += " selected";
          }
        }
      }
    }
  }

  function init() {
    var previous = document.createElement("div");
    var next = document.createElement("div");
    previous.id = "previous";
    previous.addEventListener("click", previousMonth);
    next.id = "next";
    next.addEventListener("click", nextMonth);
    var top = document.createElement("div");
    top.id = "topRow";
    top.appendChild(previous);
    top.appendChild(next);
    monthYearHeader = document.createElement("div");
    monthYearHeader.id = "monthYearHeader";
    top.appendChild(monthYearHeader);
    container.appendChild(top);
    container.appendChild(genDayHeaders());
    for (var i = 0; i < 6; i++) {
      weeks.push(document.createElement("div"));
      weeks[i].className = "week";
      for (var j = 0; j < 7; j++) {
        var day = document.createElement("div");
        day.className = "day";
        day.addEventListener("click", function() {
          if (/previousMonth/.test(this.className)) {
            previousMonth();
          } else if (/nextMonth/.test(this.className)) {
            nextMonth();
          } else {
            selectDate(new Date(showingYear, showingMonth, parseInt(this.innerText || this.textContent)));
          }
        });
        weeks[i].appendChild(day);
      }
      container.appendChild(weeks[i]);
    }

    genMonthYearHeader();
    genWeeks();
  }

  function nextMonth() {
    showingMonth = (showingMonth + 1) % 12;
    if (!showingMonth) {
      showingYear++;
    }
    genMonthYearHeader();
    genWeeks();
  }

  function previousMonth() {
    showingMonth = (showingMonth - 1 + 12) % 12;
    if (showingMonth == 11) {
      showingYear--;
    }
    genMonthYearHeader();
    genWeeks();
  }

  function selectDate(date, dateInputFocus) {
    var sel = container.querySelector(".day.selected");
    if (sel) {
      sel.className = sel.className.replace(/\s*selected/g, "");
    }
    if (showingMonth != date.getMonth() || showingYear != date.getFullYear()) {
      showingMonth = date.getMonth();
      showingYear = date.getFullYear();
      genMonthYearHeader();
      genWeeks();
    }
    var possibleDays = container.querySelectorAll(".day:nth-child(" + ((date.getDay() + 1 - locales[locale].firstDay) || 7) + ")");
    for (var i = 0; i < possibleDays.length; i++) {
      var day = possibleDays.item(i);
      if ((day.innerText == date.getDate() || day.textContent == date.getDate())
        && !/previousMonth/.test(day.className) && !/nextMonth/.test(day.className)) {
          day.className += " selected";
          break;
      }
    }
    selected = {
      month: date.getMonth(),
      date: date.getDate(),
      year: date.getFullYear()
    };
    callback(selected, dateInputFocus);
  }

  function selectedDate() {
    return Boolean(selected);
  }

  function showTodayOrSelected() {
    if (selected) {
      showingMonth = selected.month;
      showingYear = selected.year;
    } else {
      showingMonth = now.getMonth();
      showingYear = now.getFullYear();
    }
    genMonthYearHeader();
    genWeeks();
  }

  function validate(text) {
    return new RegExp("^" + locales[locale].dateFormat.replace(/\//g, "\\/").replace(/\./g, "\\.")
      .replace(/(mm|dd)/g, "(\\s\\d|\\d{2})")
      .replace("yy", "(\\d{4})") + " (\\s\\d|\\d{2}):\\d{2} (AM|PM)$").test(text);
  }

  init();

  this.format = format;
  this.selectDate = selectDate;
  this.selectedDate = selectedDate;
  this.showTodayOrSelected = showTodayOrSelected;
  this.validate = validate;

  Object.preventExtensions(this);
}
Object.preventExtensions(DatePicker);