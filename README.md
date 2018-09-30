# ThermoFloor App - Multireg / Heatit Z-wave thermostat for electrical floor heating
This app adds support for devices made by [ThermoFloor](http://www.thermo-floor.no/).  
<a href="https://github.com/TedTolboom/hk.com.remotec">
  <img src="https://raw.githubusercontent.com/TedTolboom/no.ThermoFloor/master/assets/images/small.jpg">
</a>  

## Links:
[ThermoFloor (Heatit) Athom apps](https://apps.athom.com/app/no.ThermoFloor)                      
[ThermoFloor Github repository](https://github.com/TedTolboom/no.ThermoFloor)             

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

The following action cards are supported:

* Set the temperature (of current thermostat mode)   
* Set the thermostat mode   
* Set the setpoint of a thermostat mode   

This app is compatible with the [Heating schedule app](https://apps.athom.com/app/de.codeking.heatingschedule) updating the target temperature of the active thermostat mode       

## Supported Languages:
* English   
* Dutch    

## Acknowledgements:
This app and driver development has been supported by:   
* The alpha release testers (much appreciated): N.Peters, D.Bonsaksen and D.Janssen   
* Robbshop by providing a thermostat for debugging:   
<a href="https://www.robbshop.nl/heat-it-wandthermostaat-zwaveplus-zwart">
  <img src="https://www.robbshop.nl/skin/frontend/robbshop/default/images/logo.svg" width="25%">

## Feedback:
Any requests please post them in the [ThermoFloor (Heatit) app topic on the Athom Forum](https://forum.athom.com/discussion/3181/) or contact me on [Slack](https://athomcommunity.slack.com/team/tedtolboom)    
If possible, please report issues at the [issues section on Github](https://github.com/TedTolboom/no.ThermoFloor/issues) otherwise in the above mentioned topic.     

### Donate:
If you like the app, consider a donation to support development    
[![Paypal Donate](https://www.paypalobjects.com/en_US/NL/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=5JCN4Q3XSBTBJ&lc=NL&item_name=Athom%20Homey%20apps&item_number=ThermoFloor%20app&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

## Changelog:
v2.0.0
* WORK IN PROGRESS VERSION - DO NOT INSTALL

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
