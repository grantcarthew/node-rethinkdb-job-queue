Atomic update
[Update](http://rethinkdb.com/api/javascript/update/)
[Branch](http://rethinkdb.com/api/javascript/branch/)
[Eq](http://rethinkdb.com/api/javascript/eq/)

Example: Perform a conditional update.
If the post has more than 100 views, set the type of a post to hot, else set it to normal.

r.table("posts").get(1).update(function(post) {
    return r.branch(
        post("views").gt(100),
        {type: "hot"},
        {type: "normal"}
    )
}).run(conn, callback)
