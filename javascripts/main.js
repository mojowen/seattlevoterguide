(function() {
    var geocoder = new google.maps.Geocoder(),
        districts = false,
        callback = false

    /** Mapping **/
    function findWard(lat, lng) {
        var point = {
            "type": "Feature",
                "geometry": {
                "type": "Point",
                    "coordinates": [lng, lat]
            }
        };
        for (var i in districts.features) {
            var the_district = districts.features[i]
            if (turf.inside(point, the_district)) {
                var center = turf.centroid(the_district).geometry.coordinates
                mapIt(the_district, center, [lng, lat]);
                renderCounselors(the_district.properties.DIST_NUM.toString());
                return the_district;
            }
        }
        new_map([lng, lat]);
    }
    function specifyWard(district_number) {
        var the_district = districts.features.filter( function(el) {
                return el.properties.DIST_NUM == district_number; })[0],
            center = turf.centroid(the_district).geometry.coordinates
        mapIt(the_district, center, center);
        renderCounselors(district_number);
    }
    function new_map(center) {
        map_canvas.style.display = 'block';
        var map = new google.maps.Map(map_canvas, {
            zoom: 12,
            center: new google.maps.LatLng(center[1], center[0]),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            scrollwheel: false,
            overviewMapControl: false,
            streetViewControl: false,
            zoomControl: false,
            panControl: false,
            mapTypeControl: false,
            scaleControl: false,
            draggable: true
        });
        return map;
    }
    function mapIt(district, center, home) {
        var map = new_map(center);

        new google.maps.Marker({
            position: new google.maps.LatLng(home[1], home[0]),
            map: map})

        map.data.addGeoJson(district);
        map.data.setStyle({
            "strokeWeight": 1,
            "color": "red",
            "fillColor": "red",
            "fillOpacity": 0.1,
            "strokeColor": "red"
        });
        return map;
    }

    /** Templates **/
    function renderCounselors(district) {
        var districts = counselors.querySelectorAll('.district')
        for (var i = districts.length - 1; i >= 0; i--) {
            var div_district = districts[i].getAttribute('data-district')
            if( div_district !== district && div_district != 'At-large') {
                districts[i].style.display = 'none';
            }
        };
    }
    function endorsementWidget(button) {
        var button = button,
            name = button.getAttribute('data-name'),
            link = button.getAttribute('data-link'),
            office = button.getAttribute('data-office'),
            generic_link = document.createElement('a'),
            cover = document.createElement('div'),
            outers = document.createElement('div'),
            inners = document.createElement('div'),
            socials = document.createElement('div'),
            messages = document.createElement('strong'),
            parent = button.parentElement

        parent.className += ' now_voting_for'

        button.onclick = endorsementWidgetclose
        button.innerText = 'close'

        cover.setAttribute('id','the_cover')
        cover.onclick = endorsementWidgetclose

        generic_link.setAttribute('target','_blank')

        var facebook = generic_link.cloneNode(),
            twitter = generic_link.cloneNode(),
            tumblr = generic_link.cloneNode()

        facebook.className = "fa fa-facebook"
        twitter.className = "fa fa-twitter"
        tumblr.className = "fa fa-tumblr"

        facebook.onclick = function() {
            log_share('facebook', office, name)
            this.className += ' clicked'}
        twitter.onclick = function() {
            log_share('twitter', office, name)
            this.className += ' clicked'
        }
        tumblr.onclick = function() {
            log_share('tumblr', office, name)
            this.className += ' clicked'
        }

        message = ["Vote",name,"for",office].join(' ')

        track = (name.toLowerCase().replace(/[\uE000-\uF8FF]/g, '')
                 .replace(/\s/g,'-'))
        if( ['yes','no'].indexOf(track) !== -1 ) {
            track +=  '-'+office.toLowerCase().replace(/\s/g,'-')
        }

        link = "http://www.denvervoterguide.org"+link
        link += '?utm_source=endorse'
        link += '&utm_campaign='+track

        var facebook_link = escape(link+'&utm_medium=facebook')
        facebook.setAttribute('href',
            "https://www.facebook.com/sharer/sharer.php?u="+facebook_link)
        var tweet_params = ["text="+message,
                        "url="+escape(link+'&utm_medium=twitter'),
                        "hashtags="+hashtag,
                        "related="+related].join('&')
        twitter.setAttribute('href',
            "https://twitter.com/intent/tweet?"+tweet_params)

        var tumblr_params = ["v=3",
                        "u="+escape(link+'&utm_medium=tumblr'),
                        "t="+message,
                        "s="].join('&')
        tumblr.setAttribute('href',
            "https://www.tumblr.com/share?"+tumblr_params);

        socials.appendChild(twitter)
        socials.appendChild(facebook)
        socials.appendChild(tumblr)

        messages.innerText = 'Spread the word:'
        socials.className = 'socials'
        inners.className = 'inners'
        outers.className = 'outers'

        inners.appendChild(messages)
        inners.appendChild(socials)
        outers.appendChild(inners)

        if( button.nextSibling && button.nextSibling.nodeType != 4 ) {
            parent.appendChild(outers)
        } else {
            parent.insertBefore(outers, button.nextSibling)
        }

        document.body.appendChild(cover)

        log_endorse(office, name)

        function endorsementWidgetclose() {
            parent.style.position = null
            parent.style.zIndex = null
            parent.style.backgound = null
            parent.style.borderRadius = null
            parent.className = parent.className.replace(' now_voting_for','')
            button.className += ' fa checked fa-check-circle-o'
            button.innerText = 'endorsed'
            button.onclick = function() { endorsementWidget(this) }

            parent.removeChild(outers)

            document.body.removeChild(cover)
        }
    }
    window.endorsementWidget = endorsementWidget

    /** Bindings **/
    function searchSubmit() {
        map_canvas.innerHTML = "";

        var address = this.address.value;
        if( address.toLowerCase().search('denver') === -1 ) {
            address += ' Denver CO'
        }
        if( address.toLowerCase().search('il') === -1 ||
                address.toLowerCase().search('illinois') === -1 ) {
            address += ' CO'
        }

        geocoder.geocode({
            address: address
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var parse = results[0].geometry.location.toString().replace(/\(|\)/g, '')
                    lat = parse.split(',')[0],
                    lng = parse.split(',')[1]
                when_ready(function() { findWard(lat, lng) })
                for( var i = 0; i < results[0].address_components.length; i++) {
                    if( results[0].address_components[i].types[0] == 'postal_code' ) {
                        log_zip(results[0].address_components[i].long_name);
                        break;
                    }
                }
            }
        });
        return false;
    }
    function log_zip(zip) {
        try { ga('send', 'event', 'lookup', zip); } catch(e) { }
    }
    function log_endorse(type, thing) {
        try { ga('send', 'event', 'endorse', type, thing); } catch(e) { }
    }
    function log_share(method, type, thing) {
        try { ga('send', 'event', "share_"+method, type, thing); } catch(e) { }
    }
    function when_ready(runn_func) {
        if( districts ) {
            if( callback ) {
                return callback()
            } else if( typeof runn_func != 'undefined' ) {
                return runn_func()
            }
        } else if( typeof runn_func != 'undefined' ) {
            callback = runn_func
        }
    }
    function getOrdinal(n) {
       var s=["th","st","nd","rd"],
           v=n%100;
       return n+(s[(v-20)%10]||s[v]||s[0]);
    }

    var current_onload = window.onload || function() {}
    window.onload = function() {
        current_onload()

        search_form.onsubmit = function() { searchSubmit.apply(this); return false; }

        tinyGET('/data/district_shapes.json',{},
            function(data) { districts = data; when_ready(); });

        if( document.location.hash.length > 0 ) {
            if( document.location.hash[1] != '!' ) {
                search_form.address.value = document.location.hash.replace('#','').replace(/\+/g,' ')
                searchSubmit.apply(search_form)
            } else {
                if( document.location.hash[2] == '@') {
                    when_ready( function() {
                        specifyWard(document.location.hash.replace(/[^0-9]/g,''))
                        var old_link = document.location.hash
                        document.location.hash = 'counselors'
                        document.location.hash = old_link
                    });
                }
            }
        }

        var search = document.location.search.split(/\&|\?/)

        for (var i = 0; i < search.length; i++) {
            var key = search[i].split('=')[0].toLowerCase(),
                val = search[i].split('=')[1]
            if( key == 'address' ) {
                search_form.address.value = val.replace(/\+/g,' ')
                searchSubmit.apply(search_form)
            }
        };
    }

})()
