var alphabetArray = [
	["a", "g", "m", "s", "y", "\u2713"],
	["b", "h", "n", "t", "z", "?"],
	["c", "i", "o", "u", '\u2423', ","],
	["d", "j", "p", "v", '\u2190', "*"],
	["e", "k", "q", "w", ".", "$"],
	["f", "l", "r", "x", "!", "%"]
]

function arrayLookup(row,column) 
{   
	var letter = alphabetArray[row][column];
	return letter;
};

words =  ["the","of","and","a","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","I","at","be","this","have","from","or","one","had","by","word","but","not","what","all","were","we","when","your","can","said","there","use","an","each","which","she","do","how","their","if","will","up","other","about","out","many","then","them","these","so","some","her","would","make","like","him","into","time","has","look","two","more","write","go","see","number","no","way","could","people","my","than","first","water","been","call","who","oil","its","now","find","long","down","day","did","get","come","made","may","part"]

var column_search = true;
var item = 1;
var interval_set = false;
var row_val = 0;
var col_val = 0;

var Clock = {
	totalSeconds: -1,
	
	start: function()
	{
		var self = this;
		this.interval = setInterval(function()
		{
			if(self.totalSeconds == 5)
			{
					self.totalSeconds = -1;
			}
			self.totalSeconds += 1;			
			if(column_search){
				
				var colgroupName = "colgroup";
				colgroupName = colgroupName + "-" + self.totalSeconds;
				$('#'+colgroupName).addClass("hover", 500);
				var lastCol;
				
				if(self.totalSeconds == 0)
				{
					lastCol = 5;
				}
				else
				{
					lastCol = self.totalSeconds - 1;
				}
				$('#'+'colgroup-'+lastCol).removeClass("hover", 500);
			}
			else if(!column_search){
				
				var rowgroupName = "rowgroup";
				rowgroupName = rowgroupName + "-" + self.totalSeconds;
				$('#'+rowgroupName).addClass("hover", 500);
				var lastRow;
				
				if(self.totalSeconds == 0)
				{
					lastRow = 5;
				}
				else
				{
					lastRow = self.totalSeconds - 1;
				}
				
				table = $("table")[0];
				var lastCell = table.rows[lastRow].cells[col_val];
				
				var cell = table.rows[self.totalSeconds].cells[col_val];
				$(cell).addClass("selected-cell", 500);
				$('#'+'rowgroup-'+lastRow).removeClass("hover", 500);
				$(lastCell).removeClass("selected-cell", 0);
			}
		}, 1000);
	},
	
	pause: function(){
		clearInterval(this.interval);
		delete this.interval;
	},
	
	restart: function(){
		if(!this.interval){
			this.totalSeconds = 0;
			this.start();
		}
	}
};

var string = "";
function findLetter(row, column)
{	
	if (row >= 0 && column >= 0)
	{
		var result = alphabetArray[row][column]
			
		if (result == "\u2713"){       	
	       	var enterKeyEvent = $.Event("keydown");
    		enterKeyEvent.keyCode = $.ui.keyCode.ENTER;  // event for pressing "enter" key
    		$("#message").val($('#message').val() + " ");
    		string = $("#message").val();
		}
		else if (result != "\u2190")
		{
			if(result == "\u2423"){
				result = "\u0020";
			}
			string += result;
			$('#message').val(string);
		}
		else if (result == '\u2190')
		{
			if (string.length > 0)
			{
				string = string.slice(0, -1);
				$('#message').val(string);
			}
			else
			{
				
			}
		}
		$("#message").keyup();
	}
};

function throttle (callback, limit) {
    var wait = false;                 // Initially, we're not waiting
    return function () {              // We return a throttled function
        if (!wait) {                  // If we're not waiting
            callback.call();          // Execute users function
            wait = true;              // Prevent future invocations
            setTimeout(function () {  // After a period of time
                wait = false;         // And allow future invocations
            }, limit);
        }
    }
}
	
$( document ).ready(function() 
{

	ws = new WebSocket("ws://127.0.0.1:8888/ws");
	ws.onmessage = throttle(function(evt){
		$(document).trigger("blink");
	}, 200);


	var area = new AutoSuggestControl("message");

	function display()
	{
		var table = document.getElementById("table");
		var tbody = document.createElement('tbody');
	
		for (i = 0; i < alphabetArray.length; i++) 
		{
			var vals = alphabetArray[i];
			var row = document.createElement('tr');
			row.id = "rowgroup-" + i;

			for (var b = 0; b < vals.length; b++) 
			{
				var cell = document.createElement('td');
				cell.textContent = vals[b];
				row.appendChild(cell);
			}
		
			tbody.appendChild(row);
		}
	
		table.appendChild(tbody);
		$("tr").addClass("rowgroup");
	}

	display();	
	Clock.start();
	$(document).on("blink", function(evt){
		if(column_search)
		{
			column_search = false;
			col_val = Clock.totalSeconds;
			Clock.totalSeconds = -1;
		}
		else
		{
			column_search = true;
			$("#column").html($("#seconds").html());
			$("colgroup").removeClass("hover",0);
			$(".rowgroup").removeClass("hover",0);
			$("td").removeClass("selected-cell",0);
			row_val = Clock.totalSeconds;
			Clock.totalSeconds = -1;
			findLetter(row_val, col_val);
		}
	});
});
