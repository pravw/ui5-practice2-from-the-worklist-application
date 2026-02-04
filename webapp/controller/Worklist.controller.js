sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/m/ObjectIdentifier",
    "sap/m/Text",
    "sap/m/ObjectStatus",
    "sap/m/ObjectNumber",
    "sap/m/ColumnListItem",
    "sap/m/ObjectListItem",
    "sap/m/ObjectAttribute",
    "sap/m/StandardListItem",
    "sap/ui/core/Icon",
    "sap/ui/export/library",
    "sap/m/library"   
], (BaseController,JSONModel,formatter,Sorter,Filter,FilterOperator,Spreadsheet,ObjectIdentifier,Text,ObjectStatus,ObjectNumber,ColumnListItem,ObjectListItem,ObjectAttribute,StandardListItem,Icon,exportLibrary,mobileLibrary) => {
    "use strict";
    const EdmType = exportLibrary.EdmType;

    return BaseController.extend("ui5.project3.controller.Worklist", {
         formatter: formatter,
      
               /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");



            
            // Set icon tab counts
            this._setIconFilterCounts();

             // Bind items
            



        },

   

        onPress: function(oEvent){

            // const oRouter = this.getRouter()
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);

            oRouter.navTo("Worklistdetail",{

             ProductID: oEvent.getSource().getBindingContext().getProperty("ProductID")
             

            })

        },

          onSelectFilter(oEvent) {
            var oBinding = this.getView().byId("table").getBinding("items")
            var sSelectedKey = oEvent.getParameter("key")
            var aFilter = []

            // Create filters
            switch (sSelectedKey) {
                case "available":
                    aFilter.push(new Filter("UnitsInStock", FilterOperator.GE, 20))
                    break;
                case "lowOnStock":
                    aFilter.push(new Filter("UnitsInStock", FilterOperator.BT, 1, 19))
                    break;
                case "unavailable":
                    aFilter.push(new Filter("UnitsInStock", FilterOperator.LT, 1))
                    break;
                default:
                    break;
            }

            oBinding.filter(aFilter)
        },


       
          onExport: function() {
            var oTable = this.getView().byId("table");
            var aColumns = this._getCoulumnConfig();
            var oSettings = {
                workbook: {
                    columns: aColumns,
                },
                dataSource: oTable.getBinding("items"),
                fileName: "Products.xlsx"
            }

            var oSheet = new Spreadsheet(oSettings);

            oSheet.build().finally(function() {
                oSheet.destroy();
            })
        },



           _setIconFilterCounts: function() {
            var oModel = this.getOwnerComponent().getModel();

            oModel.read("/Products/$count", {
                success: function(iCount) {
                    this.getModel("worklistView").setProperty("/countAll", iCount)
                }.bind(this)
            })


            oModel.read("/Products/$count", {
                filters: [ new Filter("UnitsInStock", FilterOperator.GE, 20) ],
                success: function(iCount) {
                    this.getModel("worklistView").setProperty("/countAvailable", iCount)
                }.bind(this)
            })

            oModel.read("/Products/$count", {
                filters: [ new Filter("UnitsInStock", FilterOperator.BT, 1, 19) ],
                success: function(iCount) {
                    this.getModel("worklistView").setProperty("/countLowOnStock", iCount)
                }.bind(this)
            })

            oModel.read("/Products/$count", {
                filters: [ new Filter("UnitsInStock", FilterOperator.LT, 1) ],
                success: function(iCount) {
                    this.getModel("worklistView").setProperty("/countUnavailable", iCount)
                }.bind(this)

        })
        },

         _createListItem: function(sId, oContext) {
        const bDiscontinued = oContext.getProperty("Discontinued")

        if (bDiscontinued) {
          return new StandardListItem(sId, {
            icon: "sap-icon://alert",
            title: "{ProductName}",
            info: "This item is no longer available",
            infoState: "Warning"
          })
        } else {
          return new ObjectListItem(sId, {
            type: mobileLibrary.ListType.Navigation,
            press: this.onPress.bind(this),
            title: "{ProductName}",
            attributes: [
              new ObjectAttribute({
                title: "Category",
                text: "{Category/CategoryName}"
              })
            ],
            firstStatus: new ObjectStatus({
              text: "{= ${Discontinued} ? ${i18n>discontinued} : ${i18n>inProduction}}",
              state: "{= ${Discontinued} ? 'Error' : 'Success'}"
            }),
            number: "{UnitsInStock}",
            numberUnit: "In stock"
          })
        }
      },



         _getCoulumnConfig: function() {
            var aColumns = []    

            aColumns.push({  
                label: this.getResourceBundle().getText("productId"),
                property: "ProductID",  
                type: EdmType.Number   
            });  

            aColumns.push({ 
                label: this.getResourceBundle().getText("tableNameColumnTitle"),
                property: "ProductName",
                type: EdmType.String
            });

            aColumns.push({
                label: this.getResourceBundle().getText("category"),
                property: "Category/CategoryName",
                type: EdmType.String
            });

            aColumns.push({   
                label: this.getResourceBundle().getText(" supplier"),
                property: "Supplier/CompanyName",
                type: EdmType.String
            });

            aColumns.push({
                label: this.getResourceBundle().getText("status"),
                property: "Discontinued",
                type: EdmType.Boolean,
                trueValue: this.getResourceBundle().getText("discontinued"),
                falseValue: this.getResourceBundle().getText("inProduction")
            });

            aColumns.push( {
                label: this.getResourceBundle().getText("unitsInStock"),
                property: ["UnitsInStock", "QuantityPerUnit"],
                type: EdmType.String,
                template: '{0} - ({1})'
            });

            return aColumns
        }

    });
});


