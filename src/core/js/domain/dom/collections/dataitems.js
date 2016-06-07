/**
* DataItems Collection
*/
;(function() {
	'use strict';		
	
	/**
	 * update collection dataview: filtering
	 * @param {Object} context - jplist controller 'this' object
	 * @param {Array.<jQuery.fn.jplist.StatusDTO>} statuses
	 */
	var filter = function(context, statuses){
	
		var filterStatuses
			,status
			,filterService;

		//get all filter statuses that have registered filter services		
		filterStatuses = jQuery.fn.jplist.StatusesService.getFilterStatuses(statuses);

		if(filterStatuses.length > 0){

			for(var i = 0; i<filterStatuses.length; i++){
				
				status = filterStatuses[i];

				//get filter service
				filterService = jQuery.fn.jplist.DTOMapperService.filters[status.data.filterType];

				//modify dataview
				context.dataview = filterService(status, context.dataview);
			}

			//trigger filter event
			context.observer.trigger(context.observer.events.listFiltered, [statuses, context]);
		}
	};	
	
	/**
	 * dataview pagination
	 * @param {Object} context - jplist controller 'this' object
	 * @param {Array.<jQuery.fn.jplist.StatusDTO>} statuses
	 */
	var pagination = function(context, statuses){
		
		var actionStatuses
			,paging = null
			,status
			,currentPage = 0
            ,itemsPerPage = 0;

		//get pagination statuses		
		actionStatuses = jQuery.fn.jplist.StatusesService.getStatusesByAction('paging', statuses);

		if(actionStatuses.length > 0){

			for(var i=0; i<actionStatuses.length; i++){
			
				//get pagination status
				status = actionStatuses[i];

                if(status.data){

                    if(jQuery.isNumeric(status.data.currentPage)){

                        //init current page
                        currentPage = status.data.currentPage;
                    }

                    if(jQuery.isNumeric(status.data.number) || status.data.number === 'all'){

                        //init current page
                        itemsPerPage = status.data.number;
                    }
                }
			}

            //create paging object
            paging = new jQuery.fn.jplist.PaginationService(currentPage, itemsPerPage, context.dataview.length);

            //add paging object to the paging status
            for(var j=0; j<actionStatuses.length; j++){

                if(actionStatuses[j].data) {

                    actionStatuses[j].data.paging = paging;
                }
            }

            //update dataview
            context.dataview = jQuery.fn.jplist.FiltersService.pagerFilter(paging, context.dataview);

            //trigger pagination event
			context.observer.trigger(context.observer.events.listPaginated, [statuses, context]);
		}
		
	};
	
	/**
	 * sort dataview
	 * @param {Object} context
	 * @param {Array.<jQuery.fn.jplist.StatusDTO>} statuses
	 */
	var sort = function(context, statuses){
		
		var sortStatuses = [];
		
		//get all sort statuses, expand statuses group if needed		
		sortStatuses = jQuery.fn.jplist.StatusesService.getSortStatuses(statuses);

        if(sortStatuses.length > 0){

		    jQuery.fn.jplist.SortService.doubleSort(sortStatuses, context.dataview);

			//trigger sort event
			context.observer.trigger(context.observer.events.listSorted, [statuses, context]);
        }
	};
	
	/**
	 * apply statuses
	 * @param {Object} context
	 * @param {Array.<jQuery.fn.jplist.StatusDTO>} statuses
     * @return {jQueryObject}
	 */
	var applyStatuses = function(context, statuses){

		//reset dataview
		resetDataview(context);

		//sorting
		sort(context, statuses);
		
		//filtering
		filter(context, statuses);
				
		//pagination
		pagination(context, statuses);

		//render list
		context.observer.trigger(context.observer.events.statusesAppliedToList, [context, statuses]);

        return dataviewToJqueryObject(context);
	};
	
	/**
	 * dataview toString
	 * @param {Object} context
	 * @return {string}
	 */
	var dataviewToString = function(context){
	
		var dataitem
			,html = ""
			,i;
		
		for(i=0; i<context.dataview.length; i++){
		
			//get dataitem
			dataitem = context.dataview[i];
			
			//add dataitem html
			html += dataitem.html;
		}

		return html;
	};
	
	/**
	 * convert dataview to jquery object
	 * @return {jQueryObject}
	 */
	var dataviewToJqueryObject = function(context){
		
		return jQuery(context.dataview).map(function(index, $element){
			return $element.jqElement.get();
		});
	};
	
	/**
	 * convert dataitems to jquery object
	 * @return {jQueryObject}
	 */
	var dataitemsToJqueryObject = function(context){
		
		return jQuery(context.dataitems).map(function(index, $element){
			return $element.jqElement.get();
		});
	};
		
	/**
	 * reset dataview: dataview <- dataitems
	 * @param {Object} context
	 */
	var resetDataview = function(context){

		context.dataview = jQuery.merge([], context.dataitems);
	};
		
	/**
	 * find dataitem by its id in dataitems array
	 * @param {Object} context
	 * @param {jQueryObject} item - item to add to dataitems array
	 * @return {number} - index of dataitem in dataitems array, or -1 if not found
	 */
	var indexOf = function(context, item){
		
		var dataitem
			,index = -1
			,html1
			,html2;
		
		for(var i=0; i<context.dataitems.length; i++){
		
			//get dataitem
			dataitem = context.dataitems[i];
			
			//get outer html
			html1 = jQuery.fn.jplist.HelperService.getOuterHtml(dataitem.jqElement);
			html2 = jQuery.fn.jplist.HelperService.getOuterHtml(item);
			
			if(html1 === html2){ //dataitem.jqElement.is(item)	
				index = i;
				break;
			}
		}
		
		return index;
	};
	
	/**
	 * delete dataitem from dataitems array
	 * @param {Object} context
	 * @param {jQueryObject} $item - jquery element to delete
	 */
	var delDataitem = function(context, $item){
	
		var index;
		
		index = indexOf(context, $item);
		
		if(index !== -1){
		
			context.dataitems.splice(index, 1);

            //trigger event that data item was removed from the dataitems collection
	        context.observer.trigger(context.observer.events.dataItemRemoved, [$item, context.dataitems]);
		}
	};
	
	/**
	 * delete dataitem collection from dataitems array
	 * @param {Object} context
	 * @param {jQueryObject} $items - jquery element to delete
	 */
	var delDataitems = function(context, $items){
	
		$items.each(function(){			
			delDataitem(context, jQuery(this));
		});
	};
	
	/**
	 * add jquery item to jplist dataitems array
	 * @param {Object} context
	 * @param {jQueryObject} $item - item to add to dataitems array
	 * @param {Array.<jQuery.fn.jplist.PathModel>} paths - paths objects array
	 * @param {number} index
	 */
	var addDataItem = function(context, $item, paths, index){
	
		var dataItem;

		//create dataitem
		dataItem = new jQuery.fn.jplist.DataItemModel($item, paths, index);

		//insert item into the given index
		context.dataitems.splice(index, 0, dataItem);

        //trigger event that data item was added to the dataitems collection
	    context.observer.trigger(context.observer.events.dataItemAdded, [dataItem, context.dataitems]);
	};
	
	/**
	 * add items to collection
	 * @param {Object} context - jplist controller 'this' object
	 * @param {jQueryObject} $items
	 * @param {number} i
	 * @param {Array.<jQuery.fn.jplist.PathModel>} paths - paths objects array
	 * @param {number} index
	 */
	var addDataItemsHelper = function(context, $items, i, paths, index){
		
		var $item
			,TEXT_NODE = 3;
		
		for(; i<$items.length; i++){
			
			//get item
			$item = $items.eq(i);
			
			if($item.get(0).nodeType !== TEXT_NODE){
			    
				//add item to the array
				addDataItem(context, $item, paths, i);
				
				//setTimeout is added to improve browser performance
				/* jshint -W083 */
				if(i + 1 < $items.length && i % 50 === 0){
					window.setTimeout(function(){
						addDataItemsHelper(context, $items, i, paths, index);
					}, 0);
				}
				/* jshint +W083 */
			}
		}		
	};
	
	/**
	 * add jquery item collection to jplist dataitems array
	 * @param {Object} context
	 * @param {jQueryObject} $items - items to add to dataitems array
	 * @param {Array.<jQuery.fn.jplist.PathModel>} paths - paths objects array
	 * @param {number} index
	 */
	var addDataItems = function(context, $items, paths, index){

		//add items to collection
		addDataItemsHelper(context, $items, 0, paths, index);
		
		//update dataview
		resetDataview(context);
	};
	
	/**
	 * empty collection
	 * @param {Object} context
	 */
	var empty = function(context){
		context.dataitems = [];
		context.dataview = [];
	};

    /**
     * add new panel paths
     * @param {Object} context
     * @param {Array.<jQuery.fn.jplist.PathModel>} newPanelPaths - new paths objects array
     */
    var addPaths = function(context, newPanelPaths){

        for(var i=0; i<context.dataitems.length; i++){

            context.dataitems[i].addPaths(newPanelPaths);
        }

        //update dataview
        resetDataview(context);
    };
	
	/** 
	 * DataItems Collection
	 * @constructor
	 * @param {Object} observer
	 * @param {jQueryObject} $items - initial items to add to the collection
	 * @param {Array.<jQuery.fn.jplist.PathModel>} paths - paths objects array
	 */
	jQuery.fn.jplist.Dataitems = function(observer, $items, paths){

		this.dataitems = [];
		this.dataview = [];
        this.paths = paths;

		this.observer = observer;

		if($items.length > 0){
		
			//add ittems to collection
			addDataItems(this, $items, paths, 0);		
		}
		
		//trigger collection ready event
		this.observer.trigger(this.observer.events.collectionReadyEvent, [this]);		
	};

    /**
     * add new panel paths
     * @param {Array.<jQuery.fn.jplist.PathModel>} newPanelPaths - new paths objects array
     */
    jQuery.fn.jplist.Dataitems.prototype.addPaths = function(newPanelPaths){
        addPaths(this, newPanelPaths);
    };
	
	/**
	 * API: apply statuses
	 * @param {Array.<jQuery.fn.jplist.StatusDTO>} statuses
     * @return {jQueryObject}
	 */
	jQuery.fn.jplist.Dataitems.prototype.applyStatuses = function(statuses){
		return applyStatuses(this, statuses);
	};
	
	/**
	 * API: filter dataview
	 */
	jQuery.fn.jplist.Dataitems.prototype.filter = function(statuses){
		filter(this, statuses);
	};
	
	/**
	 * API: sort dataview
     * @param {Array.<jQuery.fn.jplist.StatusDTO>} statuses
	 */
	jQuery.fn.jplist.Dataitems.prototype.sort = function(statuses){
		sort(this, statuses);
	};
	
	/**
	 * API: dataview	pagination
	 */
	jQuery.fn.jplist.Dataitems.prototype.pagination = function(statuses){
		pagination(this, statuses);
	};
	
	/**
	 * API: convert dataview to jquery object
	 * @return {jQueryObject}
	 */
	jQuery.fn.jplist.Dataitems.prototype.dataviewToJqueryObject = function(){
		return dataviewToJqueryObject(this);
	};
	
	/**
	 * API: convert dataitems to jquery object
	 * @return {jQueryObject}
	 */
	jQuery.fn.jplist.Dataitems.prototype.dataitemsToJqueryObject = function(){
		return dataitemsToJqueryObject(this);
	};
	
	/**
	 * API: reset dataview collection with initial dataitems set
	 */
	jQuery.fn.jplist.Dataitems.prototype.resetDataview = function(){
		resetDataview(this);
	};
		
	/**
	 * API: empty collection
	 */
	jQuery.fn.jplist.Dataitems.prototype.empty = function(){
		empty(this);
	};
	
	/**
	 * API: convetrs jQuery element (item) to dataitem and adds it to the dataitems collection
	 * @param {jQueryObject} item - jquery item to add
	 * @param {Array.<jQuery.fn.jplist.PathModel>} paths - paths objects array
	 * @param {number} index
	 */
	jQuery.fn.jplist.Dataitems.prototype.addDataItem = function(item, paths, index){
		addDataItem(this, item, paths, index);
	};
	
	/**
	 * API: convetrs a set of jQuery elements (items) to dataitems and adds them to the dataitems collection
	 * @param {jQueryObject} items - jquery items to add
	 * @param {Array.<jQuery.fn.jplist.PathModel>} paths - paths objects array
	 * @param {number} index
	 */
	jQuery.fn.jplist.Dataitems.prototype.addDataItems = function(items, paths, index){
		addDataItems(this, items, paths, index);
	};
	
	/**
	 * API: searches for jQuery element (item) in the dataitems collection and deletes it
	 * @param {jQueryObject} item - jquery element (item) to delete
	 */
	jQuery.fn.jplist.Dataitems.prototype.delDataitem = function(item){
		delDataitem(this, item);
	};
	
	/**
	 * API: searches for jQuery elements (items) in the dataitems collection and deletes them
	 * @param {jQueryObject} items - jquery element to delete
	 */
	jQuery.fn.jplist.Dataitems.prototype.delDataitems = function(items){
		delDataitems(this, items);
	};
	
	/**
	 * API: searches for dataitem in the collection (by id)
	 * @param {jQueryObject} item - jquery element to delete
	 * @return {number} - index of dataitem in dataitems array
	 */
	jQuery.fn.jplist.Dataitems.prototype.indexOf = function(item){
		return indexOf(this, item);
	};
	
	/**
	 * API: get HTML of the collection in the current state (dataview): with the current filter, sorting etc.
	 * @return {string}
	 */
	jQuery.fn.jplist.Dataitems.prototype.dataviewToString = function(){
		return dataviewToString(this);
	};
	
})();