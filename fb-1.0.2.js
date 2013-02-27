/* 
 * @name        gorillaFB v 1.0.2 BETA
 * @date        2013-02-12
 * @developers  Tomasz Zaborski,
 * @company     Gorilla Media
 * @website     http://www.gorilla-media.pl
 * @homepage    https://dev.gorilla-media.pl
 */

var gorillaFB = {
    /*
     *  CONFIGURATION
     */
    app_cfg : {
        debug: false,
        picturePattern : window.location.protocol+"//graph.facebook.com/[id]/picture"
    },
    config : {
        appId       : "",
        channel     : "",
        status      : true,
        cookie      : true,
        xfbml       : true,
        permissions : ''
    },
    user : {
        initAuth : "",
        details : ""
    },
    callbacks : {},
    /*
     *  DEBUG
     */
    debug : function(msg) {
        if (gorillaFB.app_cfg.debug && (typeof console == "object")) {
            console.log(msg);
        }
    },
    isEmpty : function(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }
 
        return true;
    },
    hasPermission : function(name) {
        var self = this;
        if ( self.config.permissions.indexOf(name) >= 0) {
            return true;
        } else {
            return false;
        }
    },
    error : function(message) {
        alert("[ERROR] "+message);
    },
    /*
     *
     */
    /*
     * BASIC INIT FUNCIONALITY
     * 
     * - Facebook API AsyncInit
     * - Basic getLoginStatus response callback
     */
    init : function(config) {
        var self = this;
        
        // Extend configuration
        gorillaFB.config = $.extend( {}, gorillaFB.config, config);
        
        window.fbAsyncInit = function() {
            FB.init({
                appId      : self.config.appId,
                channelUrl : self.config.channel,
                status     : self.config.status,
                cookie     : self.config.cookie,
                xfbml      : self.config.xfbml
            });

            /*
             *  FB API getLoginStatus() callback
             *  http://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/
             *  
             */
            FB.getLoginStatus(function(response) {
                // Save user authorization
                gorillaFB.user.initAuth = response;
                // Debug purpose
                gorillaFB.debug(response);
                
                // Basic response handler
                if (response.status === 'connected') {
                    self.getUserDetails();
                } else if (response.status === 'not_authorized') {
                    gorillaFB.debug("User has not authentificated this application.")
                } else {
                    gorillaFB.debug("User isnt logged in to Facebook.")
                }
                
                // User defined callback
                if (self.callbacks.getLoginStatus !== undefined) {
                    self.callbacks.getLoginStatus(response);
                }
                
                gorillaFB.debug(gorillaFB);
            });
            
        };
    },
    /*
     *  FB API login()
     *  http://developers.facebook.com/docs/reference/javascript/FB.login/
     */
    login : function() {
        var self = this;
        
        // call FB.login()
        FB.login(function(response) {
            // Debug purpose
            self.debug(response);
            
            // Regular FB response action
            if (response.authResponse) {
                self.getUserDetails();
            } else {
                self.error("User cancelled login or did not fully authorize.");
            }
            
            // User defined callback
            if (self.callbacks.login !== undefined) {
                self.callbacks.login(response);
            }
            
            return false;
        }, {
            scope : self.config.permissions
        });
    },
    /*
     *  FB API api() functionality
     *  
     *  User details
     */
    getUserDetails : function() {
        var self = this;
        FB.api('/me', function(response) {
            // Save user details
            self.user.details = response;
            
            // User defined callback
            if (self.callbacks.apiMe !== undefined) {
                self.callbacks.apiMe(response);
            }
            
            return response;
        });
    },
    /*
     *  FB API
     *  
     *  Returns url to photo of: user, album, page, app
     *  @data.type      string  | square, small, normal, large
     *  @data.width     int     | 0-200
     *  @data.height    int     | 0-200 
     *  
     *  
     */
    getPhoto : function(data) {
        var self = this;

        // Make default photo ID
        if (data.id == undefined) {
            data.id = self.user.details.id;
        }
        
        var url = self.app_cfg.picturePattern.replace('[id]',data.id);
        
        if (data.type == undefined) {
            // Provided dimensions
            url = url + "?width="+data.width+"&height="+data.height;
        } else {
            switch (data.type) {
                default:
                    url = url + "?type=square";
                    break;
                case "small":
                    url = url + "?type=small";
                    break;
                case "normal":
                    url = url + "?type=normal";
                    break;
                case "large":
                    url = url + "?type=large";
                    break;
            }
            
        }
        
        //self.debug(url);
        return url;
    },
    getFriends : function(params) {
        var self = this;
        // Default API URL
        var url = "/me/friends";
        
        // Check if limit parameter is present, if yes limit results
        if (params !== undefined && params.limit !== undefined) {
            // Prepare query
            url = url + "?limit="+params.limit;
        }
        
        // Call Facebook API
        FB.api(url, function(response) {     
            // Check if user defined callback
            if (params !== undefined && params.callback !== undefined) {
                // Execute user callback
                params.callback(response);
            }
        });
    },
    getLikes : function(params) {
        var self = this;
        
        // Check if application has required permission to execute getLikes()
        if (self.hasPermission("user_likes")) {
            // Default API URL
            var url = "/me/likes";
            
            // Check if limit parameter is present, if yes limit results
            if (params !== undefined && params.limit !== undefined) {
                url = url + "?limit="+params.limit;
            }
            
            // Call Facebook API
            FB.api(url, function(response) {       
                
                // Check if user defined callback
                if (params !== undefined && params.callback !== undefined) {
                    // Execute user callback
                    params.callback(response);
                }
            });
        } else {
            // Display error
            self.error("user_likes permission required to get user likes!")
        }
    },
    isFan : function(params) {
        var self = this;
        // Check if application has required permission to execute 
        if (self.hasPermission("user_likes")) {
            var url = "/me/likes";
            
            // Check if page ID provided
            if (params !== undefined && params.id !== undefined) {
                url = url + "/"+params.id;
            }
            
            //
            var _isFan = false;
            
            FB.api(url, function(response) {
                // Regular action
                if(response.data) {
                    if(!self.isEmpty(response.data)) {
                        _isFan = true;
                    }
                } else {
                    self.error("Unable to check if user liked page.");
                }
                
                // Check for assignTo parameter
                if (params !== undefined && params.assignTo !== undefined) {
                    // Execute user callback
                    window[params.assignTo] = _isFan;
                }
                
                // Check if user defined callback
                if (params !== undefined && params.callback !== undefined) {
                    // Execute user callback
                    params.callback(response);
                }
            });
        }
        
    },
    /*
     *  User Wall/Timeline/Facebook functionalities
     */
    post : function(params) {
        var defaults = {
            method      :   'feed',
            name        :   "name",
            link        :   "picture",
            caption     :   "caption",
            description :   "description"
        };
        
        var options = $.extend( {}, defaults, params);
        
        FB.ui(options, function(response) {
            if (params !== undefined && params.callback !== undefined) {
                // Execute user callback
                params.callback(response);
            }
        });
    },
    addPhoto : function(params) {  
        var self = this;
        // Check if album ID provided?
        if (params !== undefined && params.albumID !== undefined) {
            var url = "/"+params.albumID+"/photos";
        } else {
            var url = "/photos";
        }
        
        // Prepare Facebook POST request
        FB.api(url, 'post', {
            message :   params.description, // Image description
            url     :   params.url          // Image URL
        }, function(response){
            // Check for error
            if (!response || response.error) {
                self.error('Error occured. Photo was not uploaded.');
            } 
            
            // Callback?
            if (params !== undefined && params.callback !== undefined) {
                // Execute user callback
                params.callback(response);
            }

        });
    },
    /*
     * FB API, FQL functionalities
     * 
     */
    query : function(params) {
        var self = this;
       
        FB.api('fql',
        {
            q: params.query
        },
        function(response) {
            if (params !== undefined && params.callback !== undefined) {
                // Execute user callback
                params.callback(response);
            }
        });
    },
    usedByFriends : function(params) {
        var self = this;
        
        // Run query
        self.query({
            query       : "SELECT uid, name, is_app_user FROM user WHERE uid IN (SELECT uid2 FROM friend WHERE uid1=me()) AND is_app_user=1",
            callback    : (params !== undefined && params.callback !== undefined) ? params.callback : function() {}
        });
    }
}

