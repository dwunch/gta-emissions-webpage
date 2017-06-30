$(function() {
  initializeMap();
});
//Define some Variables

var CH4Array = [];
legend = L.control({position: 'bottomright'}),
div = L.DomUtil.create('div', 'info legend');


function initializeMap() {                                    //Set initial conditions of map
  var map = L.map('map').setView([43.6532, -79.3832], 15);    //Center the map to these coordinates originally; set zoom
  var mapMarkers = [];

  //Call the map tile to be used. This is from 'mapbox'
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 20,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(map);                     //Add the tile to the map




var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    //var div = L.DomUtil.create('div', 'info legend'),
    grades = [1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5],
    labels = [];
    // Add title to the legend
    div.innerHTML += '<b>Methane (ppm)</b><br>'
    // loop through temperature gradient to make a corresponding color gradient and labels
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i], CH4Array) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
}

return div;
};

legend.addTo(map);

  //Define a Function which will poll data from 'datasource.txt'
  (function pollDataSource() {
    setTimeout(function() {
      $.ajax({                        // This block does the bulk of the work:
        url: "../datasource.txt",     // "Ajax" tells the browser to perform these tasks
        cache: false,                 // behind the scenes. If successful, the information
        success: function(data) {     // polled from datasource.txt is passed to the processData
          processData(map, mapMarkers, data);     // function.
        },
        error: function() {           // If polling unsuccessful, return the following error
          alert("Error encountered while polling data source.");
        },
        complete: pollDataSource      // This calls the pollDataSource function again,
      });                             // leading to an infinite loop.
    }, 5000);                          // This is the argument passed to the 'setTimeout' function.
  })();                               // It simply inserts a 1000 ms time delay before
}                                   // the next polling call

function getOpacity(d) {
  var maxConcentration = 40.0000
  var minConcentration = 0.0000
  var deltaConcentration = (maxConcentration - minConcentration)
  var Opacity = ((d - minConcentration)/deltaConcentration)

  return Opacity;
}

function getColor(d, array) {
  if (array.length > 1){
    var max = Math.max.apply(Math, CH4Array)
    var min = Math.min.apply(Math, CH4Array)
    var delta = (max - min)
    var x = ((d - min)/delta)
    var r = Math.floor(x * 255.)
    var g = 0
    var b = 255. - Math.floor(x * 255.)
    color = "rgb("+r+" ,"+g+","+ b+")"
  
    } else if (array.length < 2){
      color = 'red'
  }
  return color;
}

function scaleLength(d) {
  var max = 20.
  var min = 0.
  var delta = (max - min)
  var x = ((d - min)/delta)*100

  return x ;
}

legend.update = function(CH4Array) {
        grades = [],
        intervals = 8,
        gradeInterval = (Math.max.apply(Math, CH4Array) - Math.min.apply(Math, CH4Array))/intervals,
        labels = [];
        
  // Create an array of grades by incrementally adding to the min value
  for (var i = 0; i < 8; i++) {
      grades.push(Math.min.apply(Math, CH4Array) + (gradeInterval * i));
    }
  // Add title to the legend
  div.innerHTML += '<b>Methane (ppm)</b><br>'
  for (var i = 0; i < intervals; i++) {
        div.innerHTML +=
              '<i style="background:' + getColor(grades[i], CH4Array) + '"></i> ' +
              //grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
              grades[i] + (grades[i + 1] ? '<br>' : '+');

    }
  //return div;       
}


function processData(map, mapMarkers, data) {                               //  Here we define what happens to the data that got polled from datasource.txt.
  if (map && mapMarkers && data) {
    div.innerHTML='';
    if (legend === undefined){
      legend.addTo(map);
    };
    
    var dataRows = data.replace(/\s/g, '').split(";");
    var startingIndex = 0;
    if (dataRows.length > 601 ) {
      startingIndex = dataRows.length - 601;
    } else if (dataRows.length < 601 ) {
      for (i = dataRows.length - 1; i < 600; i++) {
        if (mapMarkers[i] && mapMarkers[i][0] instanceof L.Marker) {
          map.removeLayer(mapMarkers[i][0]);
          
        }

        if (mapMarkers[i] && mapMarkers[i][1] instanceof L.CircleMarker) {
          map.removeLayer(mapMarkers[i][1]);
        }
      }
    }
  
    for (i = startingIndex; i < dataRows.length - 1; i++) {
      try {
        if (mapMarkers[i - startingIndex] && mapMarkers[i - startingIndex][0] instanceof L.Marker) {
          map.removeLayer(mapMarkers[i - startingIndex][0]);
        }

        if (mapMarkers[i - startingIndex] && mapMarkers[i - startingIndex][1] instanceof L.CircleMarker) {
          map.removeLayer(mapMarkers[i - startingIndex][1]);
        }
//format of datasource.txt line format:
// date time,lat,lon,alt,temp,wd,ws,pressure,hdop,lgr_time,ch4,ch4se,h2o,h2ose,co2,co2se,co,cose,ch4d,ch4dse,co2d,co2dse,cod,codse,gasp,gaspse,t,tse,amb,ambse,rd1,rd1se,rd2,rd2se;
        var dataComponents = dataRows[i].split(",");                // Break up line i in datasource by commas,                                     
        var timeStamp = dataComponents[0];                          // call this the variable 'dataComponents'.
        var latitude = dataComponents[1];                           // We set a variable for each parameter in datasource.txt.
        var longitude = dataComponents[2];
        var temperature = dataComponents[4];
        var windDirection = dataComponents[5];
        var windSpeed = dataComponents[6];                          //Speed in m/s
        var pressure = dataComponents[7];
        //var avgTime = dataComponents[8];
        var CH4 = dataComponents[18];
        if (CH4) {
          CH4Array.push((Math.round(CH4*1000))/1000);
        }
        var H2O = dataComponents[12];
        var CO2 = dataComponents[20];
	      var CO = dataComponents[22];

        var arrow_icon = L.icon({
            iconUrl: 'https://cdn1.iconfinder.com/data/icons/simple-arrow/512/arrow_24-128.png',
            iconSize:     [50, scaleLength(windSpeed)],  // size of the icon [width,length]
            iconAnchor: [25, scaleLength(windSpeed)],    // Location on the icon which corresponts to it's actual position (pixels in x-y coordinates from top left)
            });

        var arrowMarker = new L.marker([latitude, longitude], {
          icon: arrow_icon,
          rotationAngle: windDirection
        });

        var circleMarker = new L.circleMarker([latitude, longitude], {                     //  We Create a marker positioned and colored corresponding to the data passed
          color: getColor(CH4, CH4Array),                                                            // from datasource.txt.
          radius: 9,
          opacity: 0.9,
          fillOpacity: 0.9
          }).bindPopup(
            "<p>Time (UTC): "           + timeStamp.substring(0, 2) + ':' 
          + timeStamp.substring(2, 4) +  ':' + timeStamp.substring(5) +  "</p>"
        //+ "<p>Temperature (C): "           + temperature +     "</p>"
          + "<p>Wind Direction: "            + windDirection +   "</p>"
          + "<p>Wind Speed (m/s): "          + windSpeed +       "</p>"
        //+ "<p>Pressure (hPa): "            + pressure +        "</p>"
          + "<p>Methane (ppm): "             + CH4 +             "</p>" 
          + "<p>Water (ppm): "               + H2O  +            "</p>"
          + "<p>CO (ppm): "                  + CO   +            "</p>"
          + "<p>Carbon Dioxide: "            + CO2  +            "</p>");     // Add a popup tag which will show if someone clicks on the dot.

        mapMarkers[i - startingIndex] = [];
        mapMarkers[i - startingIndex][0] = arrowMarker;
        mapMarkers[i - startingIndex][1] = circleMarker;

        map.addLayer(mapMarkers[i - startingIndex][0]);
        map.addLayer(mapMarkers[i - startingIndex][1]);
    
      } catch(err) {

      }
    }legend.update(CH4Array);
  }
}



