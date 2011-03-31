var os = require('os'),
    sys = require('sys'),
    hostname = os.hostname().split('.')[0];

var IN_TIME = 1, IN_REQ = 2, IN_CODE = 3, IN_REF = 4, IN_UA = 5,
    OPT_TIME = 6;

exports.process_log_line = function(l) {

// "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"( %T)?"
// This is fugly to be faster than a regex.

  var o = {}, i = 0, state = 0;
  var m = l.split(" ");

  while(i < m.length) {
    if(i==0) { o.ip = m[i++]; continue; }
    else if(i==3) state = IN_TIME;

    switch(state) {
      case IN_TIME:
        if(m[i++].substr(-1) === ']') state = IN_REQ;
         break;
      case IN_REQ:
        if(m[i].substr(0,1) === "\"") o.method = m[i].substr(1);
        else if(m[i].substr(-1) === "\"") {
          var ver = /[Hh][Tt][Tt][Pp]\/(\d+\.\d+)\"$/.exec(m[i]);
          if(ver) o.http_version = ver[1];
          if(!(/^https?:\/\//.test(o.url)))
            o.url = "http://" + hostname + o.url;
            state = IN_CODE;
        }
        else o.url = ('url' in o) ? (o.url + " " + m[i]) : m[i];
        i++;
        break;
      case IN_CODE:
        o.code = m[i];
        state = IN_REF;
        i+=2; /*skip size*/
        break;
      case IN_REF:
        if(m[i].substr(0,1) === "\"" && m[i].substr(-1) === "\"") {
          o.referrer = m[i].substr(1,m[i].length-2);
          state = IN_UA;
        }
        else if(m[i].substr(0,1) === "\"") {
          if(!o.referrer) o.referrer = m[i].substr(1);
        }
        else if(m[i].substr(-1) === "\"") {
          o.referrer = o.referrer + " " + m[i].substr(0,m[i].length-1);
          state = IN_UA;
        }
        else o.referrer = o.referrer + " " + m[i];
        i++;
        break;
      case IN_UA:
        if(m[i].substr(0,1) === "\"" && m[i].substr(-1) === "\"") {
          o['user-agent'] = m[i].substr(1,m[i].length-2);
          state = OPT_TIME;
        }
        else if(m[i].substr(0,1) === "\"") {
          if(!o['user-agent']) o['user-agent'] = m[i].substr(1);
        }
        else if(m[i].substr(-1) === "\"") {
          o['user-agent'] = o['user-agent'] + " " + m[i].substr(0,m[i].length-1);
          state = OPT_TIME;
        }
        else o['user-agent'] = o['user-agent'] + " " + m[i];
        i++;
        break;
      case OPT_TIME:
        var timing = /^(\d+(?:\.\d+))$/.exec(m[i]);
        if(timing) o.load_time = timing[1];
        i = m.length; /* end it all */
        break;
      default:
        i++;
    }
  }
  return o;
}
