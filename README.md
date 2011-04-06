# circ-beacon-log

This project povides a server-side continuous log processing agent
that submits events in near real-time to Circonus event analysis
systems.

## Processors

circ-beacon-log does all the fancy works of reading loglines and
batching and pushing back up to Circonus.  However, we don't know
what you your log lines look like.  If they are standard Apache
common log format lines, we've shipped a sample apache-clf processor.

Writing your own processor is dirt simple.  To create a processor named
fooprocessor, create a file called fooprocessor.js with a single
function in it:

     exports.process_log_line = function(l) {
       // l contains a single log line.
       // parse l into an object with keys in it.
       var a = l.split(/,/);
       return { key: 'foo', ip: a[0], value_numeric: a[1] };
     }

This will read events of type foo and emit javascript objects that
contain a key foo (so we know what type of event it is) and we expect
two columns of data, for example: IP address , load time.

Now, in Circonus, you can create reports on BizEKG reports on events
where key == "foo" and see things like average load time by geography,
etc.
