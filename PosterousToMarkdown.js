var fs = require("fs");
var mustache = require('mustache');
var md = require('html-md')
var moment = require('moment');

//var file = "/Users/Shared/Posterous - bbohling.com/2012.09.07-13.16.02 PosterousBackup - bohling@gmail.com/Brandon Bohling {Again}/2009.09.01 Pix/post.json";
//var file = "/Users/Shared/Posterous - bbohling.com/2012.09.07-13.16.02 PosterousBackup - bohling@gmail.com/Brandon Bohling {Again}/2010.10.30 Maui Photos/post.json";
var sourceDirectory = '/Users/bbohling/Code/github/PosterousToMarkdown/data/Posterous - bbohling.com/2012.09.07-13.16.02 PosterousBackup - bohling@gmail.com/Brandon Bohling {Again}';

fs.readdir(sourceDirectory, function (err, files) {
  if (err) {
    console.log('> ERROR: could not read directory.');
    return;
  }
  var ctr = 1;
  files.forEach(function (fileObject) {
    var path = sourceDirectory + '/' + fileObject;
    fs.stat(path, function (err, stat) {
      if (stat && stat.isDirectory()) {
        var postPath = path + '/post.json';
        fs.stat(postPath, function (err, stat) {
          if (stat && stat.isFile()) {
            doIt(postPath);
          }
        });  
      }
    });
  });

});

function doIt(file) {

  fs.readFile(file, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }

    data = JSON.parse(data);
   
    var tmpDate = moment(data.display_date, "YYYY/MM/DD HH:mm:SS Z"); //2012/08/03 17:53:29 -0700
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
    var postDate = tmpDate.format("YYYY-MM-DD HH:mm");
    var fileName = tmpDate.format("YYYY-MM-DD") + '-' + slug;

    post = {
      date: postDate,
      title: postTitle,
      publish: publish,
      tags: tags,
      content: content,
      fileName: fileName
    };

    persistToFile(post);

  });
}

function persistToFile(post) {
  var templateFile = "postTemplate.md";
  fs.readFile(templateFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    var postText = mustache.to_html(data, post);

    var savePostAs = "output/" + post.fileName + ".md";
    fs.writeFile(savePostAs, postText, 'utf8', function (err, data) {
      if (err) {
        console.log('> ERROR - Save post as markdown: ' + err);
        return;
      }
      // console.log('Save post as markdown: done');
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
