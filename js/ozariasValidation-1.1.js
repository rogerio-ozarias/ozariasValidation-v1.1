/**
 * Plugin ozariasValidation 1.1
 *
 * Copyright(c) 2018, Rogério Ozarias
 * http://www.ozarias.com
 *
 * Validate forms with test and add functions 
 * @author Rogério de Ozarias
 * @version 1.1
 */
(function($){
$.fn.ozariasValidation = function(settings){           

    this.parentElement = $(this); 

    this.divErrorContent = $("<div></div>",{
        class:'col row'
    }).css({                        
        'clear':'both',
        'background-color': '#f2dede',
        'color':'red',
        'text-align':'left',
        'margin': '10px 0',       
        'padding': '10px',        
        'font-weight': 'bold',
    });

    this.fieldErrors = [];

    this.divErrorContentId = "ozariasValidationError";    

    this.config = {           
        language: 'pt-br',       
        divErrorFocus: true,
        divErrorPosition:"bottom",// top or bottom default:bottom        
        divErrorContent: this.divErrorContent,
        completeValidateField: function(elementField, success){},       
        completeValidateForm: function(elementForm, fieldErrors, object){
            return object.completeValidateForm(elementForm, fieldErrors)
        }
    } 

    $.extend(this.config, settings); 

    this.completeValidateForm = function($this, fieldErrors){
        $($this).find("#"+this.divErrorContentId).remove();
        if(fieldErrors.length > 0){
            switch(this.config.divErrorPosition){
                case "top":
                     var errorContent = $(this.config.divErrorContent)
                        .html(fieldErrors.join("<br />"))
                        .attr("id", this.divErrorContentId)
                        .prependTo($this);
                break;
                case "bottom":
                default:
                    var errorContent = $(this.config.divErrorContent)
                        .html(fieldErrors.join("<br />"))
                        .attr("id", this.divErrorContentId)
                        .appendTo($this);
            }  
        
            if(this.config.divErrorFocus){
                var destination = $(errorContent).offset().top;
                $("html:not(:animated),body:not(:animated)").animate({
                    scrollTop: destination-200
                }, 1100);      
            } 
            $($this).find(".ozariasValidationErrorInput:eq(0)").focus();
            
            return false;
        }
        return true;  
    }

    this.validateField = function($this){
        var validate = true;
        msgErrorField = $.ozariasValidationField($this, this.config);

        // chama função ao validar cada campo
        this.config.completeValidateField($this, (msgErrorField.length > 0)); 

        // salva as mensagens de erro em um array
        if(msgErrorField.length > 0){                                     
            for(var i=0; i<msgErrorField.length; i++){                                   
                if(msgErrorField[i]){
                    this.fieldErrors[this.fieldErrors.length] = msgErrorField[i];                        
                }                    
            }                
            return false;
        }
        return true; 
    }

    this.validateForm = function(){
        var name = "";
        var $this = this;
        this.fieldErrors = [];            
        
        // remove a classe error
        $(this.parentElement).find(".ozariasValidationErrorInput")
            .removeClass("ozariasValidationErrorInput");

        $(this.parentElement).find("[class*='validate[']").each(function(){                
            if(!$(this).prop("disabled")){
                if(name != $(this).attr("name")){
                    name    = $(this).attr("name");
                    if(!$this.validateField($(this))){
                        $(this).addClass("ozariasValidationErrorInput");
                    }
                }
            }
        });           

        // chama função ao validar formulario
        return $this.config.completeValidateForm(this.parentElement, this.fieldErrors, this);             
    }

    

    return this;
}
$.ozariasValidationField = function($this, settings){

    var language = $.ozariasValidationLanguage();

    var config = {        
        configDefault:{
            regex : {
                email:{
                    test: /^[a-zA-Z0-9_\.\-]+\@([a-zA-Z0-9\-]+\.)+[a-zA-Z0-9]{2,4}$/
                }                                  
            },
            confirm:{},func:{},int:{},max:{},min:{},maxlength:{},minlength:{},ajax:{},
        },        
        configFields:{},
        msg : {
            required:function(obj, labelName, value, type){
                var name = $(obj).attr("name");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                var msg = "";
                if(typeof language[config.language].requiredMessage != "undefined")
                    msg = language[config.language].requiredMessage;
                
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].required != "undefined")
                        if(typeof config.configFields[name].required.msg != "undefined")
                            msg = config.configFields[name].required.msg;                
                
                msg = msg.replace("##VALUE##", value);
                msg = msg.replace("##LABELNAME##", labelName);
                if(type == "radio" || type == "checkbox"){
                    return ($("[name='"+name+"']").is(":checked")) ? null : msg;
                }        
                return ((value=="") || (typeof value == "undefined")) ? msg : null
            },
            regex:function(obj, type, labelName, value){
                var name = $(obj).attr("name");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                var msg = "";
                var test = "";
                //regex default
                if(typeof config.configDefault.regex != "undefined")
                    if(typeof config.configDefault.regex[type] != "undefined"){
                        if(typeof config.configDefault.regex[type].test != "undefined")
                            test = config.configDefault.regex[type].test;   
                        if(typeof language[config.language].invalidMessage != "undefined")
                            msg = language[config.language].invalidMessage;
                    }
                        
                //regex field
                if(typeof config.configFields[name] != "undefined")                    
                    if(typeof config.configFields[name].regex != "undefined"){
                        if(typeof config.configFields[name].regex.test != "undefined")
                            test = config.configFields[name].regex.test;  
                        if(typeof config.configFields[name].regex.msg != "undefined")
                            msg = config.configFields[name].regex.msg;   
                    }

                if(test && msg){
                    var er = new RegExp(test);
                    if(value){      
                        msg = msg.replace("##VALUE##", value);
                        msg = msg.replace("##LABELNAME##", labelName);
                        return (!er.test(value))? msg : null;      
                    }
                }                   
            },
            func:function(obj, type, labelName, value){               
                var name = $(obj).attr("name");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                var msg = "";
                var test = "";

                //function default
                if(typeof config.configDefault.func != "undefined")
                    if(typeof language[config.language].invalidMessage != "undefined"){
                            msg = language[config.language].invalidMessage;
                    }
                        
                //function field
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].func != "undefined")
                        if(typeof config.configFields[name].func != "undefined"){
                            if(typeof config.configFields[name].func[type].msg != "undefined")
                                msg = config.configFields[name].func[type].msg;   
                        }  

                if(typeof type != "undefined"){
                    if(value){      
                        msg = msg.replace("##VALUE##", value);
                        msg = msg.replace("##LABELNAME##", labelName);
                        return (!   eval(type+"('"+value+"')")      )? msg : null;      
                    }             
                }
            },
            confirm:function(obj, labelName, value, confirm){

                var name = $(obj).attr("name");
                var parentForm = $(obj).closest("form");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                var msg = "";
                if(typeof config.configDefault.confirm != "undefined")
                    if(typeof language[config.language].confirmMessage != "undefined")
                        msg = language[config.language].confirmMessage;
                
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].confirm != "undefined")
                        if(typeof config.configFields[name].confirm.msg != "undefined")
                            msg = config.configFields[name].confirm.msg;  
                
                if($(parentForm).find("[name='"+confirm+"']").length > 0 ){
                    valueConfirm = $(parentForm).find("[name='"+confirm+"']").val();
                    
                    if(value != valueConfirm){
                        msg = msg.replace("##CONFIRM##", confirm);
                        msg = msg.replace("##VALUECONFIRM##", valueConfirm);
                        msg = msg.replace("##VALUE##", value);
                        msg = msg.replace("##LABELNAME##", labelName);
                        return msg;
                    }
                }else{
                    console.error("Element name "+confirm+" not exists");
                }
            },
            min:function(obj, labelName, value, min){
                var name = $(obj).attr("name");     
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));      
                min = min.indexOf(",")? parseFloat(min.replace(",",".")) : min;
                value = value.indexOf(",")? parseFloat(value.replace(",",".")) : value;
                
                var msg = "";
                if(typeof config.configDefault.min != "undefined")
                    if(typeof language[config.language].minMessage != "undefined")
                        msg = language[config.language].minMessage;
                
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].min != "undefined")
                        if(typeof config.configFields[name].min.msg != "undefined")
                            msg = config.configFields[name].min.msg; 
                
                if(value < min){
                    msg = msg.replace("##MIN##", min);
                    msg = msg.replace("##VALUE##", value);
                    msg = msg.replace("##LABELNAME##", labelName);
                    return msg;
                }
            },
            max:function(obj, labelName, value, max){
                var name = $(obj).attr("name");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                max = max.indexOf(",")? parseFloat(max.replace(",",".")) : max;
                value = value.indexOf(",")? parseFloat(value.replace(",",".")) : value;
                
                var msg = "";
                if(typeof config.configDefault.max != "undefined")
                    if(typeof language[config.language].maxMessage != "undefined")
                        msg = language[config.language].maxMessage;
                
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].max != "undefined")
                        if(typeof config.configFields[name].max.msg != "undefined")
                            msg = config.configFields[name].max.msg; 
                
                if(value > max){
                    msg = msg.replace("##MAX##", max);
                    msg = msg.replace("##VALUE##", value);
                    msg = msg.replace("##LABELNAME##", labelName);
                    return msg;
                }
            },
            maxlength:function(obj, labelName, value, maxlength){
                var name = $(obj).attr("name");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                var msg = "";
                if(typeof config.configDefault.maxlength != "undefined")
                    if(typeof language[config.language].maxlengthMessage != "undefined")
                        msg = language[config.language].maxlengthMessage;
                
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].maxlength != "undefined")
                        if(typeof config.configFields[name].maxlength.msg != "undefined")
                            msg = config.configFields[name].maxlength.msg; 
                
                if(value.length > maxlength){
                    msg = msg.replace("##MAXLENGTH##", maxlength);
                    msg = msg.replace("##VALUE##", value);
                    msg = msg.replace("##LABELNAME##", labelName);
                    return msg;
                }
            },
            minlength:function(obj, labelName, value, minlength){
                var name = $(obj).attr("name");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                var msg = "";
                if(typeof config.configDefault.minlength != "undefined")
                    if(typeof language[config.language].minlengthMessage != "undefined")
                        msg = language[config.language].minlengthMessage;
                
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].minlength != "undefined")
                        if(typeof config.configFields[name].minlength.msg != "undefined")
                            msg = config.configFields[name].minlength.msg; 
                
                if(value.length < minlength){
                    msg = msg.replace("##MINLENGTH##", minlength);
                    msg = msg.replace("##VALUE##", value);
                    msg = msg.replace("##LABELNAME##", labelName);
                    return msg;
                }
            },
            int:function(obj, labelName, value){
                var name = $(obj).attr("name");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                var msg = "";
                if(typeof config.configDefault.int != "undefined")
                    if(typeof language[config.language].intMessage != "undefined")
                        msg = language[config.language].intMessage;
                
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].int != "undefined")
                        if(typeof config.configFields[name].int.msg != "undefined")
                            msg = config.configFields[name].int.msg; 
                
                if(value){
                    var er = new testp(/^[\d]$/);
                    msg = msg.replace("##MAXLENGTH##", maxlength);
                    msg = msg.replace("##VALUE##", value);
                    msg = msg.replace("##LABELNAME##", labelName);
                    return (!er.test(value))? msg : null;   
                }
            },
            ajax:function(obj, labelName, value, ajax){
                var name = $(obj).attr("name");
                var labelName = ($(obj).data("labelname")) ? $(obj).data("labelname") : ($(obj).attr("name"));
                var msg = "";
                if(typeof config.configDefault.ajax != "undefined")
                    if(typeof language[config.language].invalidMessage != "undefined")
                        msg = language[config.language].invalidMessage;
                
                if(typeof config.configFields[name] != "undefined")
                    if(typeof config.configFields[name].ajax != "undefined")
                        if(typeof config.configFields[name].ajax.msg != "undefined")
                            msg = config.configFields[name].ajax.msg; 
                
                $.post(ajax, {value:value}, function(txt){
                    if(txt != false){
                        msg = msg.replace("##VALUE##", value);
                        msg = msg.replace("##LABELNAME##", labelName);
                        return msg;
                    }
                })                
            }
        }        
    }  

    $.extend(config, settings); 
    
    var msgError = [];
    var validate = true;
    var parentElement = $($this).closest("form");
    var type = $($this).attr("type");
    var name = $($this).attr("name");
    var value = $(parentElement).find("[name='"+name+"']").not(":disabled").val();
    var labelName = (typeof config.configFields[name] == "object") ? config.configFields[name].labelName : name;

    if(type == "radio"){
        if($($this).is("[class*='required']")){
            var value   = $(parentElement).find("[name='"+name+"'] :checked").val();                   
            if(text = config.msg.required($this, labelName, value, type)){
                msgError[msgError.length] = text;  
            }
        }
    }else if(type == "checkbox"){
        if($($this).is("[class*='required']")){
            var value   = $($this);                
            if(text = config.msg.required($this, labelName, value, type)){
                msgError[msgError.length] = text;  
            }
        }
    }else{
        if($($this).is("[class*='required']")){
            if(text = config.msg.required($this, labelName, value)){
                msgError[msgError.length] = text;                
            }
        }
        if($($this).is("[class*='int[']")){
            if(text = config.msg.int($this, labelName, value)){
                msgError[msgError.length] = text;                
            }
        }
        if($($this).is("[class*='regex[']")){
            var varClass = $($this).attr("class");
            var varRegex = ((varClass.split("regex["))[1].split("]"))[0];

            if(varRegex.indexOf(",") != -1){
                var arrRegex = varRegex.split(",");
                for(var i=0; i<arrRegex.length; i++){
                    if(text = config.msg.regex($this, arrRegex[i], labelName, value)){
                        msgError[msgError.length] = text;                        
                    }                
                }
            }else{
                if(text = config.msg.regex($this, varRegex, labelName, value)){                            
                    msgError[msgError.length] = text;                   
                }
            }
        }
        if($($this).is("[class*='func[']")){
            var varClass = $($this).attr("class");
            var varFunc = ((varClass.split("func["))[1].split("]"))[0];

            if(varFunc.indexOf(",") != -1){
                var arrFunc = varFunc.split(",");
                for(var i=0; i<arrFunc.length; i++){
                    if(text = config.msg.func($this, arrFunc[i], labelName, value)){
                        msgError[msgError.length] = text;                        
                    }                
                }
            }else{
                if(text = config.msg.func($this, varFunc, labelName, value)){                            
                    msgError[msgError.length] = text;                   
                }
            }
        }
        if($($this).is("[class*='confirm[']")){
            var varClass = $($this).attr("class");
            var varConfirm = ((varClass.split("confirm["))[1].split("]"))[0];

            if(text = config.msg.confirm($this, labelName, value, varConfirm)){
                 msgError[msgError.length] = text;                
            }
        }
        if($($this).is("[class*='min[']")){
            var varClass = $($this).attr("class");
            var varMin = ((varClass.split("min["))[1].split("]"))[0];

            if(text = config.msg.min($this, labelName, value, varMin)){
                msgError[msgError.length] = text;                
            }
        }
        if($($this).is("[class*='max[']")){
            var varClass = $($this).attr("class");
            var varMax = ((varClass.split("max["))[1].split("]"))[0];
            if(text = config.msg.max($this, labelName, value, varMax)){
                msgError[msgError.length] = text;                
            }
        }
        if($($this).is("[class*='maxlength[']")){                    
            var varClass = $($this).attr("class");
            var arrClass = varClass.split("maxlength[");
            var varMaxlength = ((varClass.split("maxlength["))[1].split("]"))[0];
            if(text = config.msg.maxlength($this, labelName, value, varMaxlength)){
                msgError[msgError.length] = text;                
            }
        }
        if($($this).is("[class*='minlength[']")){                    
            var varClass = $($this).attr("class");
            var arrClass = varClass.split("minlength[");
            var varMinlength = ((varClass.split("minlength["))[1].split("]"))[0];
            if(text = config.msg.minlength($this, labelName, value, varMinlength)){
                msgError[msgError.length] = text;                
            }
        }
        if($($this).is("[class*='ajax[']")){                    
            var varClass = $($this).attr("class");
            var arrClass = varClass.split("ajax[");
            var varAjax = ((varClass.split("ajax["))[1].split("]"))[0];
            if(text = config.msg.ajax($this, labelName, value, varAjax)){
                msgError[msgError.length] = text;                
            }
        }
    }
    return msgError;
}

$.ozariasValidationLanguage = function(){
    return {           
            'pt-br':{
                requiredMessage : "##LABELNAME## é obrigatório.",
                invalidMessage : "##LABELNAME## inválido.",
                confirmMessage: "O campo ##LABELNAME## não confere.",
                minMessage: "##LABELNAME## deve ser maior ou igual a ##MIN##.",
                maxMessage: "##LABELNAME## deve ser menor ou igual a ##MAX##.",
                intMessage: "##LABELNAME## deve ser um valor inteiro.",
                maxlengthMessage: "##LABELNAME## deve ter no máximo ##MAXLENGTH## caracteres.",     
                minlengthMessage: "##LABELNAME## deve ter no mínimo ##MINLENGTH## caracteres."        
            },
            en:{
                requiredMessage : "Field ##LABELNAME## is required.",
                invalidMessage : "##LABELNAME## is invalid.",
                confirmMessage: "##LABELNAME## not confirmed.",
                minMessage: "The field ##LABELNAME## must be greater than or equal to ##MIN##.",
                maxMessage: "The field ##LABELNAME## should be smaller or iqual to ##MAX##.",
                intMessage: "Field ##LABELNAME## must be an integer.",
                maxlengthMessage: "The ##LABELNAME## field must be max ##MAXLENGTH## characters.",
                maxlengthMessage: "The ##LABELNAME## field  must be at least ##MINLENGTH## characters."
            },
            es:{
                requiredMessage : "Field ##LABELNAME## es obligatorio.",
                invalidMessage : "##LABELNAME## no es válido.",
                confirmMessage: "##LABELNAME## no confirmado.",
                minMessage: "El campo ##LABELNAME## debe ser mayor o igual que ##MIN##.",
                maxMessage: "El campo ##LABELNAME## debe ser más pequeño o igual a ##MAX##.",
                intMessage: "El campo ##LABELNAME## debe ser un número entero.",
                maxlengthMessage: "El campo ##LABELNAME## debe ser max ##MAXLENGTH## caracteres.",
                maxlengthMessage: "El campo ##LABELNAME## debe tener al menos ##MINLENGTH## caracteres."
            },
            fr:{
                requiredMessage : "Le champ ##LABELNAME## est requis.",
                invalidMessage : "##LABELNAME## est invalide.",
                confirmMessage: "##LABELNAME## non confirmé.",
                minMessage: "Le champ ##LABELNAME## doit être supérieur ou égal à ##MIN##.",
                maxMessage: "Le champ ##LABELNAME## doit être plus petit ou égal à ##MAX##.",
                intMessage: "Le champ ##LABELNAME## doit être un entier.",
                maxlengthMessage: "Le champ ##LABELNAME## doit être au maximum ##MAXLENGTH## caractères.",
                maxlengthMessage: "Le champ ##LABELNAME## doit contenir au moins ##MINLENGTH## caractères."
            },
            it:{
                requiredMessage : "Il campo ##LABELNAME## è obbligatorio.",
                invalidMessage : "##LABELNAME## non valido.",
                confirmMessage: "##LABELNAME## non confermato.",
                minMessage: "Il campo ##LABELNAME## deve essere maggiore o uguale a ##MIN##.",
                maxMessage: "Il campo ##LABELNAME## deve essere più piccolo o iqual a ##MAX##.",
                intMessage: "Il campo ##LABELNAME## deve essere un numero intero.",
                maxlengthMessage: "Il campo ##LABELNAME## deve contenere max ##MAXLENGTH## caratteri.",
                maxlengthMessage: "Il campo ##LABELNAME## deve contenere almeno ##MINLENGTH## caratteri."
            }
        };
}
})(jQuery);
