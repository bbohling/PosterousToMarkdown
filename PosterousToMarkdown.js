var fs = require("fs");
var mustache = require('mustache');
var md = require('html-md')
var moment = require('moment');

var file = "/Users/Shared/Posterous - bbohling.com/2012.09.07-13.16.02 PosterousBackup - bohling@gmail.com/Brandon Bohling {Again}/2009.09.01 Pix/post.json";

fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  
  console.log("=== Reading file");

  data = JSON.parse(data);
 
  var tmpDate = moment(data.display_date);
  var slug = data.slug;
  var postTitle = data.title;
  var publish = !data.draft;
  var tags = data.tags;
  var content = md(data.body_full);

  // Get date parts for storing images
  var dt = new Date(tmpDate);
  var year = dt.getFullYear();
  var month = dt.getMonth() + 1;
  var monthDay = dt.getDate(); 
  var postDate = moment(data.display_date).format("YYYY-MM-DD HH:mm");

  post = {
    date: postDate,
    title: postTitle,
    publish: publish,
    tags: tags,
    content: content
  };

  console.log('valid date? ' + moment(data.display_date).isValid());
  console.log('date: ' + postDate);
  console.log('title: ' + postTitle);
  console.log('publish: ' + publish);

  persistToFile(post);
  
});

function persistToFile(post) {
  var templateFile = "postTemplate.md";
  fs.readFile(templateFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    var postText = mustache.to_html(data, post);

    var savePostAs = "test.md";
    fs.writeFile(savePostAs, postText, function (err, data) {
      if (err) {
        console.log('Save post as markdown: ' + err);
        return;
      } else {
        console.log('Save post as markdown: done');
      }
    });
  });
}


function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

