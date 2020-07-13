/*
jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/

/*
Options
-----------------
showWeekends: boolean
data: object
cellWidth: number
cellHeight: number
slideWidth: number
dataUrl: string
behavior: {
clickable: boolean,
draggable: boolean,
resizable: boolean,
onClick: function,
onDrag: function,
onResize: function
}
*/

(function (jQuery) {
  jQuery.fn.ganttViewH = function () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length == 1 && typeof args[0] == "object") {
      build.call(this, args[0]);
    }
  };

  function build(options) {
    //this=data:ganttData
    var els = this;
    var defaults = {
      scale: 1,
      //サイズ
      cellWidth: 5,
      cellHeight: 31,
      //slideWidth: 450,
      vHeaderWidth: 100,
      behavior: {
        clickable: true,
        resizable: true,
        draggable: true,
      },
    };
    var opts = jQuery.extend(true, defaults, options);

    if (opts.data) {
      build();
    }

    function build() {
      opts.start = 0;
      opts.end = opts.movieLeng / opts.scale;
      defaults.cellWidth = opts.cellWidth;
      els.each(function () {
        var container = jQuery(this);
        var div = jQuery("<div>", { class: "ganttviewh" });
        new Chart(div, opts).render();
        container.append(div);
      });
    }
  }

  var Chart = function (div, opts) {
    function render() {
      addVtHeader(div, opts.data, opts.cellHeight);
      var w = Math.ceil(opts.movieLeng / opts.scale);
      var p_w = w * (opts.cellWidth + 1);

      var slideDiv = jQuery("<div>", {
        id: "ganttviewh-slide-container",
        class: "ganttviewh-slide-container",
      });

      time = timeArray(opts.start, opts.end);
      addHzHeader(slideDiv, time, opts.cellWidth);
      addGrid(slideDiv, opts.data, time, opts.cellWidth, opts.showWeekends);
      addBlockContainers(slideDiv, opts.data);
      addBlocks(slideDiv, opts.data, opts.cellWidth, opts.start);
      div.append(slideDiv);
      applyLastClass(div.parent());
    }

    function timeArray(start, end) {
      var time = [];
      time[0] = start;
      time[1] = end;
      return time;
    }

    //観点部分
    function addVtHeader(div, data, cellHeight) {
      var headerDiv = jQuery("<div>", { class: "ganttviewh-vtheader" });
      for (var i = 0; i < data.length; i++) {
        if (data[i]) {
          var typeDiv = jQuery("<div>", { class: "ganttviewh-vtheader-type" });
          typeDiv.append(
            jQuery("<div>", {
              //"id":data[i].type,
              value: data[i].type,
              class: "ganttviewh-vtheader-type-name header",
              css: { height: cellHeight + "px" },
            }).append(data[i].type)
          );
          headerDiv.append(typeDiv);
        }
      }
      div.append(headerDiv);
    }
    //秒数部分
    function addHzHeader(div, time, cellWidth) {
      var p_w = cellWidth + 1;
      var headerDiv = jQuery("<div>", { class: "ganttviewh-hzheader" });
      var timeDiv = jQuery("<div>", { class: "ganttviewh-hzheader-time" });
      for (var i = time[0]; i <= time[1]; i++) {
        var ftime = formatTime(i);
        var newTimeDiv = jQuery("<div>", { class: "ganttviewh-hzheader-time" });
        newTimeDiv.css("width", p_w + "px");
        timeDiv.append(newTimeDiv.append(ftime));
        if (i == 0) {
          i++;
        }
      }
      var totalW = time[1];
      var headerWidth = (totalW + 1) * p_w;
      var windowWidth = window.innerWidth;
      if (headerWidth < windowWidth) {
        headerWidth = windowWidth;
      }
      timeDiv.css("width", headerWidth + "px");
      headerDiv.append(timeDiv);
      div.append(headerDiv);
    }

    function formatTime(seconds) {
      var result = "";
      //時間計算
      var seconds = seconds * opts.scale;
      var hour = Math.floor(seconds / 60 / 60);
      var min = Math.floor((seconds / 60) % 60)
        .toString(10)
        .replace(/^[0-9]$/, "0$&");
      var sec = Math.floor(seconds % 60)
        .toString(10)
        .replace(/^[0-9]$/, "0$&");
      if (opts.scale <= 30) {
        if (hour > 0) {
          result += hour + ":";
        }
        result += min + ":" + sec;
        return result;
      } else if (opts.scale <= 1800) {
        if (hour > 0) {
          result += hour + "h";
        }
        result += min;
        return result;
      } else if (opts.scale <= 43200) {
        result += hour + "h";
        return result;
      } else {
        var day = Math.floor(seconds / 60 / 60 / 24);
        result += day + "d";
        return result;
      }
    }
    //Grid部分
    function addGrid(div, data, time, cellWidth, showWeekends) {
      var gridDiv = jQuery("<div>", { class: "ganttviewh-grid" });
      var rowDiv = jQuery("<div>", { class: "ganttviewh-grid-row" });
      for (var i = time[0]; i < time[1]; i++) {
        var cellDiv = jQuery("<div>", { class: "ganttviewh-grid-row-cell" });
        cellDiv.css("width", cellWidth + "px");
        rowDiv.append(cellDiv);
      }
      var w =
        jQuery("div.ganttviewh-grid-row-cell", rowDiv).length * (cellWidth + 1);
      rowDiv.css("width", w + "px");
      rowDiv.css("padding-right", 0 + "px");
      for (var i = 0; i < data.length; i++) {
        gridDiv.append(rowDiv.clone());
      }
      div.append(gridDiv);
    }
    //ブロックの可動域
    function addBlockContainers(div, data) {
      var blocksDiv = jQuery("<div>", { class: "ganttviewh-blocks" });
      for (var i = 0; i < data.length; i++) {
        var path = "ganttviewh-block-container" + data[i].type;
        blocksDiv.append(
          jQuery("<div>", {
            class: "ganttviewh-block-container",
            id: data[i].type,
          })
        );
      }
      div.append(blocksDiv);
    }
    //ブロック
    //data.itemが可視化される記述
    function addBlocks(div, data, cellWidth, start) {
      var rows = jQuery("div.ganttviewh-blocks", div); //合致してるの探して配列化？/
      for (var i = 0; i < data.length; i++) {
        var timeLength = 0;
        if (data[i].items) {
          timeLength = data[i].items.length;
        }
        for (var j = 0; j < timeLength; j++) {
          var item = data[i].items[j];
          var size = Math.round(item.endTime - item.startTime) / opts.scale;
          var offset = (item.startTime - start) / opts.scale;
          var block = jQuery("<div>", {
            class: "ganttviewh-block popover",
            title: item.value,
            value: item.id,
            css: {
              width: size * (cellWidth + 1) - 3 + "px",
              "margin-left": offset * (cellWidth + 1) + "px",
            },
          });
          var classByType = "ganttviewh-block-" + data[i].type.toLowerCase();

          block.addClass(classByType);
          addBlockData(block, i, data[i].type, item);

          //Block内に常に表示するテキストの設定
          block.append(
            jQuery("<div>", {
              class: "ganttviewh-block-text",
            }).text(/*size*/ item.value)
          );
          var path = "#" + data[i].type;
          if (size > 0) {
            div.find(path).append(block);
          }
        }

        var size = Math.round(data[i].endTime - data[i].startTime);
        var offset = data[i].startTime - start;
        var block = jQuery("<div>", {
          class: "ganttviewh-block-behavior popover",
          title: data[i].comment,
          css: {
            width: size * cellWidth - 3 + "px",
            "margin-left": offset * cellWidth + "px",
          },
        });
        var series = [data[i].startTime, data[i].endTime];
        addBlockData(block, data[i], series);
        block.append(
          jQuery("<div>", { class: "ganttviewh-block-text" }).text(size)
        );
        jQuery(rows[data[i].index]).append(block);
      }
    }

    //ブロックのデータ
    function addBlockData(block, index, text, item) {
      // This allows custom attributes to be added to the series data objects
      // and makes them available to the 'data' argument of click, resize, and drag handlers
      var blockData = { id: index, type: text };
      jQuery.extend(blockData, item);
      block.data("block-data", blockData);
    }

    //lastクラスを追加
    function applyLastClass(div) {
      jQuery(
        "div.ganttviewh-grid-row div.ganttviewh-grid-row-cell:last-child",
        div
      ).addClass("last");
      jQuery(
        "div.ganttviewh-hzheader-times div.ganttviewh-hzheader-time:last-child",
        div
      ).addClass("last");
      jQuery(
        "div.ganttviewh-hzheader-months div.ganttviewh-hzheader-month:last-child",
        div
      ).addClass("last");
    }

    return {
      render: render,
    };
  };
})(jQuery);
