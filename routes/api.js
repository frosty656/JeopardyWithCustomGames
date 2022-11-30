/*
 * Serve JSON to our AngularJS client
 */

var request = require("request");
var cheerio = require("cheerio");
var _ = require("lodash");
const fs = require("fs");

function ExportSeasonListIndex(req, res, next) {
  return function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html),
        result = [];

      result.push({
        id: "Custom Games",
        name: "Custom Games",
        description: "Custom Games",
        note: "Custom Games",
      });

      $("#content table tr").each(function () {
        var data = $(this),
          row = [];
        data.children().each(function (i, element) {
          if (i == 0) {
            var link = $("a", element).first().attr("href");
            link = link.substring(link.indexOf("=") + 1, link.length);
            row.push(link);
          }
          row.push($(element).text().trim());
        });

        result.push(_.zipObject(["id", "name", "description", "note"], row));
      });

      res.json(result);
    } else {
      next(error);
    }
  };
}

function exportSeasonIndex(req, res, next) {
  return function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html),
        result = [];
      // For each file in customGames folder add it to the list

      $("#content table tr").each(function () {
        var data = $(this),
          row = [];
        data.children().each(function (i, element) {
          if (i == 0) {
            var link = $("a", element).first().attr("href");
            link = link.substring(link.indexOf("=") + 1, link.length);
            row.push(link);
          }
          row.push($(element).text().trim());
        });

        result.push(_.zipObject(["id", "name", "description", "note"], row));
      });

      res.json(result);
    } else {
      next(error);
    }
  };
}

function exportRound($, context, r) {
  var result = {};
  var round = $(r !== "FJ" ? "table.round" : "table.final_round", context);

  // Export categories
  $("tr", round)
    .first()
    .children()
    .each(function (i, element) {
      var data = $(this);
      result[["category", r, i + 1].join("_")] = {
        category_name: $(".category_name", data).text(),
        category_comments: $(".category_comments", data).text(),
        media: $("a", data).length
          ? $("a", data)
              .map(function (i, element) {
                return $(this)
                  .attr("href")
                  .replace(
                    "http://www.j-archive.com/",
                    "http://localhost:3000/"
                  );
              })
              .toArray()
          : undefined,
      };
    });

  // Export clues
  $(".clue_text", round).each(function (i, element) {
    var data = $(this);
    var header = data.parent().prev();
    if (r === "FJ") {
      header = data.parent().parent().parent().parent().prev();
    }

    var answerHtml = _.trimLeft(
      _.trimRight($("div", header).attr("onmouseover"), ")"),
      "toggle("
    )
      .split(", ")
      .slice(2)
      .join(", ");
    answerHtml = _.trim(_.trim(answerHtml), "'")
      .replace('\\"', '"')
      .replace('\\"', '"');
    var link = $(".clue_order_number a", header).attr("href");
    var daily_double = header.find(".clue_value_daily_double").length;

    result[data.attr("id")] = {
      id: link ? link.substring(link.indexOf("=") + 1, link.length) : undefined,
      daily_double: daily_double ? true : undefined,
      triple_stumper: _.contains(answerHtml, "Triple Stumper") || undefined,
      clue_text: data.text(),
      correct_response: cheerio.load(answerHtml)(".correct_response").text(),
      media: $("a", data).length
        ? $("a", data)
            .map(function (i, element) {
              return $(this)
                .attr("href")
                .replace("http://www.j-archive.com/", "http://localhost:3000/");
            })
            .toArray()
        : undefined,
    };
  });

  return result;
}

exports.seasons = function (req, res, next) {
  request(
    "http://www.j-archive.com/listseasons.php",
    ExportSeasonListIndex(req, res, next)
  );
};

exports.season = function (req, res, next) {
  // If the id is 'Custom Games' then return a list of all the files in the customGames folder
  if (req.params.id === "Custom Games") {
    var result = [];
    fs.readdir("public/customGames", function (err, files) {
      if (err) {
        next(err);
      } else {
        files.forEach(function (file) {
          result.push({
            id: file,
            name: file,
            description: "Custom Game",
            note: "Custom Game",
          });
        });
        res.json(result);
      }
    });
  } else {
    request(
      "http://www.j-archive.com/showseason.php?season=" + req.params.id,
      exportSeasonIndex(req, res, next)
    );
  }
};

exports.game = function (req, res, next) {
  // Make a list of all files in the customGames folder
  var customGames = fs.readdirSync('public/customGames/');
  // Log the list of games as json
  if (customGames.includes(req.params.id)) {
    fs.readFile("public/customGames/" + req.params.id, function (err, data) {
      if (err) {
        next(err);
      } else {
        res.json(JSON.parse(data));
      }
    });
  } else {
    request(
      "http://www.j-archive.com/showgame.php?game_id=" + req.params.id,
      function (error, response, html) {
        if (!error) {
          var $ = cheerio.load(html);

          var result = {
            id: req.params.id,
            game_title: $("#game_title").text(),
            game_comments: $("#game_comments").text(),
            game_complete: false,
          };

          _.assign(
            result,
            exportRound($, $("#jeopardy_round"), "J"),
            exportRound($, $("#double_jeopardy_round"), "DJ"),
            exportRound($, $("#final_jeopardy_round"), "FJ")
          );

          result.game_complete =
            _.countBy(_.keys(result), function (n) {
              return n.split("_")[0];
            }).clue ===
            30 + 30 + 1;

          var clueCounts = _.countBy(_.keys(result), function (n) {
            return n.split("_").slice(0, 3).join("_");
          });

          _.forEach(result, function (n, key) {
            if (_.startsWith(key, "category")) {
              n.clue_count = clueCounts[key.replace("category", "clue")];
            }
          });

          res.json(result);
        } else {
          next(error);
        }
      }
    );
  }
};

exports.saveCustomGame = function (req, res, next) {
  var game = req.body;
  if(!game.game_title) {
    res.status(400).send("Game name is required");

  } else {
    fs.writeFile(
      "public/customGames/" + game.game_title + ".json",
      JSON.stringify(game, null, indent=4),
      function (err) {
        if (err) {
          next(err);
        } else {
          res.json(game);
        }
      }
    );
  }
}

exports.deleteGame = function (req, res, next) {
  var game = req.body;
  if(!game.Id) {
    res.status(400).send("Game Id is required");
  } else {
    fs.unlink("public/customGames/" + game.Id, function (err) {
      if (err) {
        next(err);
      } else {
        res.json({ success: true });
      }
    });
  }
}