# ThermoFloor / Heatit App
This app adds support for devices made by [ThermoFloor](http://www.thermo-floor.no/) and branded as [Heatit](http://www.heatit.com).  
<a href="https://github.com/TedTolboom/hk.com.remotec">
  <img src="https://raw.githubusercontent.com/TedTolboom/no.ThermoFloor/master/assets/images/small.jpg">
</a>  

## Links:
[ThermoFloor / Heatit app at Athom apps](https://apps.athom.com/app/no.ThermoFloor)                      
[ThermoFloor / Heatit Github repository](https://github.com/TedTolboom/no.ThermoFloor)             

## Devices supported:
### Multireg / Magnum Z-wave thermostat (TF 016)
### Heatit Z-Wave thermostat (TF 021)
<a href="https://github.com/TedTolboom/no.ThermoFloor">
  <img src="https://rawgit.com/TedTolboom/no.ThermoFloor/master/drivers/TF_Thermostat/assets/icon.svg" width="25%" height="25%">
</a>  

The Multireg / Heatit Z-Wave thermostat is an electronic thermostat for flush mounting in a standard wall box for regulating electric floor heating. The thermostat has a built-in Z-Wave chip that can be connected to Home Automation systems like Homey.  

The following triggers are supported:

* Thermostat mode has changed   
* Thermostat mode has changed to   
* The temperature has changed   
* The target temperature has changed   
* Thermostat turned on / off  

The following conditions are supported:
* Thermostat is on / off   

The following action cards are supported:

* Set the temperature (of current thermostat mode)   
* Set the thermostat mode   
* Set the setpoint of a thermostat mode

### Heatit Z-TRM2(fx) (TF 033 & TF 056)
<a href="https://github.com/TedTolboom/no.ThermoFloor">
  <img src="https://rawgit.com/TedTolboom/no.ThermoFloor/master/drivers/Z-TRM2fx/assets/icon.svg" width="25%" height="25%">
</a>  

The Heatit Z-TRM2 Z-Wave thermostat is an electronic thermostat for flush mounting in a standard wall box for regulating electric floor heating. The thermostat has a built-in Z-Wave chip that can be connected to Home Automation systems like Homey.  

The following triggers are supported:

* Thermostat mode has changed   
* Thermostat mode has changed to   
* The temperature has changed   
* The target temperature has changed   
* Thermostat turned on / off  

The following conditions are supported:
* Thermostat is on / off   

The following action cards are supported:

* Set the temperature (of current thermostat mode)   
* Set the thermostat mode   
* Set the setpoint of a thermostat mode      

### Heatit Z-Push button-2  
<a href="https://github.com/TedTolboom/no.ThermoFloor">
  <img src="https://rawgit.com/TedTolboom/no.ThermoFloor/master/drivers/Z-push-button-2/assets/icon.svg" width="25%" height="25%">
</a>
The Heatit Z-Push Button 2 can control 1association group with up to 5 products or 4 scenarios through Homey.

The following triggers are supported:  
* Button Pressed 1x    
* Button held down     
* Button released    
* Any button pressed (including tokens)   

In addition, by adding the NodeID in the corresponding association groups, the Z-Push Button 8 can directly control Z-wave switches / dimmers.

### Heatit Z-Push button-8
<a href="https://github.com/TedTolboom/no.ThermoFloor">
  <img src="https://rawgit.com/TedTolboom/no.ThermoFloor/master/drivers/Z-push-button-8/assets/icon.svg" width="25%" height="25%">
</a>

The Heatit Z-Push Button 8 can control up to 4 separate association groups (onoff and dim) with up to 20 products or up to 16 scenes through Homey.

The following triggers are supported:  
* Button Pressed 1x     
* Button held down     
* Button released    
* Any button pressed (including tokens)   

In addition, by adding the NodeID in the corresponding association groups, the Z-Push Button 8 can directly control Z-wave switches / dimmers.

## Supported Languages:
* English   
* Dutch    

## Acknowledgements:
This app and driver development has been supported by:   

* The alpha release testers (much appreciated): P.R.Johansen, N.Peters, D.Bonsaksen and D.Janssen    

* Robbshop by providing a thermostat for debugging:    
  <a href="https://www.robbshop.nl/">
    <img src="https://www.robbshop.nl/skin/frontend/robbshop/default/images/logo.svg" width="25%">
  </a>

* ThermoFloor / Heatit by providing the required devices / documentation:   
  <a href="https://www.heatit.com/z-wave/">
    <img src="https://rawgit.com/TedTolboom/no.ThermoFloor/master/assets/icon.svg" width="25%">
    </a>

## Feedback:
Any requests please post them in the [ThermoFloor / Heatit app topic on the Homey community Forum](https://community.athom.com/t/166) or contact me on [Slack](https://athomcommunity.slack.com/team/tedtolboom)    
If possible, please report issues at the [issues section on Github](https://github.com/TedTolboom/no.ThermoFloor/issues) otherwise in the above mentioned topic.     

### Donate:
If you like the app, consider a donation to support development    
[![Paypal Donate](https://www.paypalobjects.com/en_US/NL/i/btn/btn_donateCC_LG.gif)](https://www.paypal.me/TedTolboom)

## Changelog:
v2.1.0 (BETA)
* Add support for the Z-wave thermostat (FW 1.92)    
* Add support for the Z-TRM2(fx) thermostat
* Add all remaining settings for the thermostats
* Add Power Regulator Mode action card for the Z-wave thermostat (use at own risk)       
* *Note*: due to an issue within the Homey Z-wave core, the measured temperatures are not reported for the Z-wave thermostat (FW 1.92) and the Z-TRM2(fx) thermostats. When this will be resolved, it is likely that the thermostat will need to be re-included      

v2.0.3
* Fix battery icon not visible on mobile interface for 1.5.13 (re-inclusion required to fix)    
* Remove not supported "Key Pressed 2 times" option from "A scene has been activated trigger card"    
* Add explicit not to settings to wake-up the Z-push before saving changes to the settings / association groups    

v2.0.2   
* Add support for the Z-Push button 2 and Z-Push button 8 devices    
* Minor (cosmetical) modifications to make the app Homey SW v2.0.0 compatible      

v2.0.1   
* Add thermostat onoff state trigger- and condition cards   

v2.0.0   
* SDK2 rewrite of the ThermoFloor / Heatit app  
* SDK2 rewrite of the Multireg / Heatit Z-Wave thermostat device driver   
* Update to meshdriver v1.2.28

v1.0.0   
* App store ready update   
* Added 2 additional action cards ('change themostat mode' and 'change setpoint of specific thermostat mode')      

v0.2.0    
* Code clean-up (MasterData array) and further bug fixes  
* Update of response time for MODE change from mobile card; setpoint will be updated based on stored values   
* Added en / nl locales   
* Added structure for 2 additional action cards ('change mode' and 'change setpoint of specific mode') (WIP)   

v0.1.2    
* Update of setpoint parsing and updating the corresponding settings    
* Update of response time for MODE change; setpoint will be updated based on stored values   

v0.1.0    
* Major update based on test results, setpoint optimization    
* Added functionality cooling mode, state icon in mobile card   
* removed settings that are read-only or not used    
