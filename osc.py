import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import socket
from pythonosc import dispatcher
from pythonosc import osc_server
from sklearn import covariance
import numpy as np
import webbrowser
import subprocess

url = "array.html"

class WSHandler(tornado.websocket.WebSocketHandler):
    def blink_handler(self, unusued_addr, args, ch1):
        if ch1 == 1:
            self.send_message("Blink")
        else:
            pass
          #  print("No blinks")

    alpha = []
    beta = []
    gamma = []
    x = []
    xx1, yy1 = np.meshgrid(np.linspace(-8, 28, 500), np.linspace(3, 40, 500))
    model = ''
    current_predictor = [0,0]
    validEntry = False
    clf = covariance.EllipticEnvelope(support_fraction=1., contamination=0.26)
    def alpha_handler(self, unused_addr, args, ch1, ch2, ch3, ch4):
        print(ch1, " ", ch2, " ", ch3, " ", ch4)
        self.alpha.append([ch1, ch2, ch3, ch4, self.validEntry])

    def beta_handler(self, unused_addr, args, ch1, ch2, ch3, ch4):
        self.beta.append([ch1, ch2, ch3, ch4, self.validEntry])

    def gamma_handler(self, unused_addr, args, ch1, ch2, ch3, ch4):
        while len(self.gamma) < 100000:
            self.gamma.append([ch1,ch2,ch3,ch4])
        else:
          clf = covariance.EllipticEnvelope(support_fraction=1., contamination=0.26)
          is_inlier = clf.fit(np.array(self.gamma)).predict(np.array([[ch1, ch2, ch3, ch4]]))[0]
        if not is_inlier:
             print("Outlier", "--Vals: ", ch1, ",",ch2,",", ch3,",", ch4)


    def concentration_handler(self, unused_addr, args, ch1):
        print(ch1)

    def mix_handler(self, *args):
        ch1 = args[2]
        ch2 = args[3]
        ch3 = args[4]
        ch4 = args[5]
        while len(self.gamma) < 1000001:
            if (args[0] == "/muse/elements/gamma_absolute"):
                self.gamma.append((ch1+ch2+ch3+ch4)/4)

        while len(self.alpha) < 1000001:
            if (args[0] == "/muse/elements/alpha_absolute"):
                self.alpha.append((ch1+ch2+ch3+ch4)/4)
        if len(self.gamma) == len(self.alpha):
            if(len(self.x) == 0):
                print(self.gamma)
                print(self.alpha)
                self.x = np.column_stack((np.array(self.gamma), np.array(self.alpha)))
            else:
                if self.current_predictor[0] == 0 and args[0] == "/muse/elements/gamma_absolute":
                    self.current_predictor[0] = (ch1+ch2+ch3+ch4)/4
                elif self.current_predictor[1] == 0 and args[0] == "/muse/elements/alpha_absolute":
                    self.current_predictor[1] = (ch1+ch2+ch3+ch4)/4
                if self.current_predictor[0] and self.current_predictor[1]:
                    print(self.clf.fit(np.array(self.x)).predict(np.array(self.current_predictor)))
                    self.current_predictor = [0,0]

    def open(self):
        dispatch = dispatcher.Dispatcher()
        dispatch.map("/muse/elements/blink", self.blink_handler, "EEG")
        dispatch.map("/muse/elements/experimental/concentration", self.concentration_handler, "EEG")
        server = osc_server.ThreadingOSCUDPServer(
            ("127.0.0.1", 5000), dispatch)
        print("Serving on {}".format(server.server_address))
        server.serve_forever()

    def on_message(self, message):
        self.write_message("received")

    def send_message(self, message):
        self.write_message("message")

    def on_close(self):
        print("closed")

    def check_origin(self, origin):
        return True

application = tornado.web.Application([
    (r'/ws', WSHandler),
])

def eeg_handler(unused_addr, args, ch1, ch2, ch3, ch4):
    print("EEG (uV) per channel: ", ch1, ch2, ch3, ch4)



def relative_hander(unused_addrs, args, ch1, ch2, ch3, ch4):
    print("EEG (uV) per channel: ", ch1, ch2, ch3, ch4)


if __name__ == "__main__":
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    myIP = socket.gethostbyname(socket.gethostname())
    subprocess.Popen('muse-io --osc osc.udp://127.0.0.1:5000')
    print('***Websocket Server Started at %s***' % myIP)
    webbrowser.open(url, new=2)
    tornado.ioloop.IOLoop.instance().start()