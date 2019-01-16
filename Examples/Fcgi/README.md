# FastCGI
## About
[FastCGI](https://en.wikipedia.org/wiki/FastCGI) allows for the creation of persistent CGI applications run in seperate processes. While no longer officially maintained on its own, FastCGI has been incorporated into popular web servers (like Apache, Nginx, and Haiwatha) and continues to be supported by the community. See the unofficial documentation [here](https://fast-cgi.github.io/).

Examples are taken from http://chriswu.me/blog/writing-hello-world-in-fcgi-with-c-plus-plus/ and use the [Nginx web server](https://www.nginx.com/). **Note: Since the writting of the tutorials the glm specification has changed. mat4 operations and contrustors now require at least one argument, ex glm:mat4 translate should now be glm::mat4 translate(1).**

## Files

## Running the examples (under Linux)
### Installing Dependencies
```
sudo apt-get install libfcgi-dev spawn-fcgi curl nginx
```
### Compilation and Running
```
# run nginx using the provided configuration
sudo nginx -c <path to nginx.conf>
# compile fcgi_script
g++ <path to fcgi program> -lfcgi++ -lfcgi -o fcgi_script
# spawn the fcgi app on port 8000 with no fork
spawn-fcgi -p 8000 -n fcgi_script
```
To see the fcgi scripts in action, you may use curl:
```
# curl request
curl http://localhost
# curl request with POST parameter
curl -d "John Smith" http://localhost/foobar